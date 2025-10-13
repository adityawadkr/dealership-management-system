import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceQuotations } from '@/db/schema';
import { eq, like, or, and, count, desc } from 'drizzle-orm';

const VALID_STATUSES = ['draft', 'sent', 'approved', 'rejected', 'expired'];

// Helper function to validate JSON string
function isValidJSON(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

// Helper function to validate service items structure
function validateServiceItems(itemsJson: string): { valid: boolean; error?: string } {
  try {
    const items = JSON.parse(itemsJson);
    
    if (!Array.isArray(items)) {
      return { valid: false, error: 'Items must be an array' };
    }

    if (items.length === 0) {
      return { valid: false, error: 'At least one service item is required' };
    }

    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') {
        return { valid: false, error: 'Each item must have a name' };
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return { valid: false, error: 'Each item must have a valid quantity' };
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        return { valid: false, error: 'Each item must have a valid unitPrice' };
      }
      if (typeof item.total !== 'number' || item.total < 0) {
        return { valid: false, error: 'Each item must have a valid total' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format for items' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const quotation = await db.select()
        .from(serviceQuotations)
        .where(eq(serviceQuotations.id, parseInt(id)))
        .limit(1);

      if (quotation.length === 0) {
        return NextResponse.json({ 
          error: 'Service quotation not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(quotation[0]);
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    let whereConditions = [];

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          like(serviceQuotations.quotationNumber, `%${search}%`),
          like(serviceQuotations.vehicleRegistration, `%${search}%`)
        )
      );
    }

    // Customer filter
    if (customerId) {
      whereConditions.push(eq(serviceQuotations.customerId, parseInt(customerId)));
    }

    // Status filter
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      whereConditions.push(eq(serviceQuotations.status, status));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(serviceQuotations)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // Get paginated results
    let query = db.select().from(serviceQuotations);
    
    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query
      .orderBy(desc(serviceQuotations.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      quotationNumber,
      customerId,
      vehicleRegistration,
      itemsJson,
      partsCost,
      laborCost,
      taxAmount,
      status,
      validUntil
    } = body;

    // Validate required fields
    if (!quotationNumber || !quotationNumber.trim()) {
      return NextResponse.json({ 
        error: 'Quotation number is required',
        code: 'MISSING_QUOTATION_NUMBER' 
      }, { status: 400 });
    }

    if (!itemsJson) {
      return NextResponse.json({ 
        error: 'Items JSON is required',
        code: 'MISSING_ITEMS_JSON' 
      }, { status: 400 });
    }

    if (partsCost === undefined || partsCost === null) {
      return NextResponse.json({ 
        error: 'Parts cost is required',
        code: 'MISSING_PARTS_COST' 
      }, { status: 400 });
    }

    if (laborCost === undefined || laborCost === null) {
      return NextResponse.json({ 
        error: 'Labor cost is required',
        code: 'MISSING_LABOR_COST' 
      }, { status: 400 });
    }

    if (taxAmount === undefined || taxAmount === null) {
      return NextResponse.json({ 
        error: 'Tax amount is required',
        code: 'MISSING_TAX_AMOUNT' 
      }, { status: 400 });
    }

    // Validate itemsJson format and structure
    if (!isValidJSON(itemsJson)) {
      return NextResponse.json({ 
        error: 'Items JSON must be a valid JSON array',
        code: 'INVALID_ITEMS_JSON' 
      }, { status: 400 });
    }

    const itemsValidation = validateServiceItems(itemsJson);
    if (!itemsValidation.valid) {
      return NextResponse.json({ 
        error: itemsValidation.error,
        code: 'INVALID_ITEMS_STRUCTURE' 
      }, { status: 400 });
    }

    // Validate costs are non-negative
    if (partsCost < 0) {
      return NextResponse.json({ 
        error: 'Parts cost cannot be negative',
        code: 'INVALID_PARTS_COST' 
      }, { status: 400 });
    }

    if (laborCost < 0) {
      return NextResponse.json({ 
        error: 'Labor cost cannot be negative',
        code: 'INVALID_LABOR_COST' 
      }, { status: 400 });
    }

    if (taxAmount < 0) {
      return NextResponse.json({ 
        error: 'Tax amount cannot be negative',
        code: 'INVALID_TAX_AMOUNT' 
      }, { status: 400 });
    }

    // Validate status if provided
    const finalStatus = status || 'draft';
    if (!VALID_STATUSES.includes(finalStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check quotation number uniqueness
    const existingQuotation = await db.select()
      .from(serviceQuotations)
      .where(eq(serviceQuotations.quotationNumber, quotationNumber.trim()))
      .limit(1);

    if (existingQuotation.length > 0) {
      return NextResponse.json({ 
        error: 'Quotation number already exists',
        code: 'DUPLICATE_QUOTATION_NUMBER' 
      }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = partsCost + laborCost + taxAmount;

    // Prepare insert data
    const now = Date.now();
    const insertData = {
      quotationNumber: quotationNumber.trim(),
      customerId: customerId || null,
      vehicleRegistration: vehicleRegistration?.trim() || null,
      itemsJson,
      partsCost,
      laborCost,
      taxAmount,
      totalAmount,
      status: finalStatus,
      validUntil: validUntil || null,
      createdAt: now,
      updatedAt: now
    };

    const newQuotation = await db.insert(serviceQuotations)
      .values(insertData)
      .returning();

    return NextResponse.json(newQuotation[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if quotation exists
    const existing = await db.select()
      .from(serviceQuotations)
      .where(eq(serviceQuotations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Service quotation not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const {
      quotationNumber,
      customerId,
      vehicleRegistration,
      itemsJson,
      partsCost,
      laborCost,
      taxAmount,
      status,
      validUntil
    } = body;

    const updates: any = {};

    // Validate and update quotation number
    if (quotationNumber !== undefined) {
      if (!quotationNumber || !quotationNumber.trim()) {
        return NextResponse.json({ 
          error: 'Quotation number cannot be empty',
          code: 'INVALID_QUOTATION_NUMBER' 
        }, { status: 400 });
      }

      // Check uniqueness only if changed
      if (quotationNumber.trim() !== existing[0].quotationNumber) {
        const duplicate = await db.select()
          .from(serviceQuotations)
          .where(eq(serviceQuotations.quotationNumber, quotationNumber.trim()))
          .limit(1);

        if (duplicate.length > 0) {
          return NextResponse.json({ 
            error: 'Quotation number already exists',
            code: 'DUPLICATE_QUOTATION_NUMBER' 
          }, { status: 400 });
        }
      }

      updates.quotationNumber = quotationNumber.trim();
    }

    // Validate and update itemsJson
    if (itemsJson !== undefined) {
      if (!isValidJSON(itemsJson)) {
        return NextResponse.json({ 
          error: 'Items JSON must be a valid JSON array',
          code: 'INVALID_ITEMS_JSON' 
        }, { status: 400 });
      }

      const itemsValidation = validateServiceItems(itemsJson);
      if (!itemsValidation.valid) {
        return NextResponse.json({ 
          error: itemsValidation.error,
          code: 'INVALID_ITEMS_STRUCTURE' 
        }, { status: 400 });
      }

      updates.itemsJson = itemsJson;
    }

    // Validate and update costs
    if (partsCost !== undefined) {
      if (partsCost < 0) {
        return NextResponse.json({ 
          error: 'Parts cost cannot be negative',
          code: 'INVALID_PARTS_COST' 
        }, { status: 400 });
      }
      updates.partsCost = partsCost;
    }

    if (laborCost !== undefined) {
      if (laborCost < 0) {
        return NextResponse.json({ 
          error: 'Labor cost cannot be negative',
          code: 'INVALID_LABOR_COST' 
        }, { status: 400 });
      }
      updates.laborCost = laborCost;
    }

    if (taxAmount !== undefined) {
      if (taxAmount < 0) {
        return NextResponse.json({ 
          error: 'Tax amount cannot be negative',
          code: 'INVALID_TAX_AMOUNT' 
        }, { status: 400 });
      }
      updates.taxAmount = taxAmount;
    }

    // Recalculate total amount if any cost changed
    if (partsCost !== undefined || laborCost !== undefined || taxAmount !== undefined) {
      const currentPartsCost = partsCost !== undefined ? partsCost : existing[0].partsCost;
      const currentLaborCost = laborCost !== undefined ? laborCost : existing[0].laborCost;
      const currentTaxAmount = taxAmount !== undefined ? taxAmount : existing[0].taxAmount;
      updates.totalAmount = currentPartsCost + currentLaborCost + currentTaxAmount;
    }

    // Validate and update status
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = status;
    }

    // Update optional fields
    if (customerId !== undefined) {
      updates.customerId = customerId || null;
    }

    if (vehicleRegistration !== undefined) {
      updates.vehicleRegistration = vehicleRegistration?.trim() || null;
    }

    if (validUntil !== undefined) {
      updates.validUntil = validUntil || null;
    }

    // Always update updatedAt
    updates.updatedAt = Date.now();

    const updated = await db.update(serviceQuotations)
      .set(updates)
      .where(eq(serviceQuotations.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if quotation exists
    const existing = await db.select()
      .from(serviceQuotations)
      .where(eq(serviceQuotations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Service quotation not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(serviceQuotations)
      .where(eq(serviceQuotations.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Service quotation deleted successfully',
      deletedRecord: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}