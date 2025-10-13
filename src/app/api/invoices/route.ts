import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq, like, and, gte, lte, count, desc } from 'drizzle-orm';

const VALID_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const VALID_TYPES = ['vehicle_sale', 'service', 'parts', 'other'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single invoice by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const invoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, parseInt(id)))
        .limit(1);

      if (invoice.length === 0) {
        return NextResponse.json({ 
          error: 'Invoice not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(invoice[0]);
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(like(invoices.invoiceNumber, `%${search}%`));
    }

    if (customerId) {
      const customerIdInt = parseInt(customerId);
      if (!isNaN(customerIdInt)) {
        conditions.push(eq(invoices.customerId, customerIdInt));
      }
    }

    if (status) {
      if (VALID_STATUSES.includes(status)) {
        conditions.push(eq(invoices.status, status));
      }
    }

    if (type) {
      if (VALID_TYPES.includes(type)) {
        conditions.push(eq(invoices.type, type));
      }
    }

    if (fromDate) {
      conditions.push(gte(invoices.createdAt, new Date(fromDate).getTime()));
    }

    if (toDate) {
      conditions.push(lte(invoices.createdAt, new Date(toDate).getTime()));
    }

    // Build query
    let query = db.select().from(invoices);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sortOrder === 'asc') {
      query = query.orderBy(invoices[sortField as keyof typeof invoices]);
    } else {
      query = query.orderBy(desc(invoices[sortField as keyof typeof invoices]));
    }

    // Get paginated results
    const results = await query.limit(limit).offset(offset);

    // Get total count for pagination meta
    let countQuery = db.select({ count: count() }).from(invoices);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalCount = await countQuery;

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount[0].count,
        limit,
        offset,
        hasMore: offset + limit < totalCount[0].count
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
      invoiceNumber, 
      type, 
      customerId, 
      referenceId, 
      referenceType,
      amount, 
      taxAmount, 
      status = 'draft',
      dueDate 
    } = body;

    // Validate required fields
    if (!invoiceNumber || !invoiceNumber.trim()) {
      return NextResponse.json({ 
        error: "Invoice number is required",
        code: "MISSING_INVOICE_NUMBER" 
      }, { status: 400 });
    }

    if (!type || !type.trim()) {
      return NextResponse.json({ 
        error: "Type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (taxAmount === undefined || taxAmount === null) {
      return NextResponse.json({ 
        error: "Tax amount is required",
        code: "MISSING_TAX_AMOUNT" 
      }, { status: 400 });
    }

    // Validate amounts are non-negative
    if (amount < 0) {
      return NextResponse.json({ 
        error: "Amount cannot be negative",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (taxAmount < 0) {
      return NextResponse.json({ 
        error: "Tax amount cannot be negative",
        code: "INVALID_TAX_AMOUNT" 
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Check invoice number uniqueness
    const existingInvoice = await db.select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber.trim()))
      .limit(1);

    if (existingInvoice.length > 0) {
      return NextResponse.json({ 
        error: "Invoice number already exists",
        code: "DUPLICATE_INVOICE_NUMBER" 
      }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = amount + taxAmount;

    // Prepare insert data
    const now = Date.now();
    const insertData = {
      invoiceNumber: invoiceNumber.trim(),
      type: type.trim(),
      customerId: customerId ? parseInt(customerId) : null,
      referenceId: referenceId ? parseInt(referenceId) : null,
      referenceType: referenceType ? referenceType.trim() : null,
      amount: parseInt(amount),
      taxAmount: parseInt(taxAmount),
      totalAmount,
      status,
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now
    };

    const newInvoice = await db.insert(invoices)
      .values(insertData)
      .returning();

    return NextResponse.json(newInvoice[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: "Invoice number already exists",
        code: "DUPLICATE_INVOICE_NUMBER" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const invoiceId = parseInt(id);

    // Check if invoice exists
    const existingInvoice = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Update invoice number if provided
    if (body.invoiceNumber !== undefined) {
      const trimmedNumber = body.invoiceNumber.trim();
      
      // Check uniqueness if changing invoice number
      if (trimmedNumber !== existingInvoice[0].invoiceNumber) {
        const duplicate = await db.select()
          .from(invoices)
          .where(eq(invoices.invoiceNumber, trimmedNumber))
          .limit(1);

        if (duplicate.length > 0) {
          return NextResponse.json({ 
            error: "Invoice number already exists",
            code: "DUPLICATE_INVOICE_NUMBER" 
          }, { status: 400 });
        }
      }

      updates.invoiceNumber = trimmedNumber;
    }

    // Update type if provided
    if (body.type !== undefined) {
      if (!VALID_TYPES.includes(body.type)) {
        return NextResponse.json({ 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          code: "INVALID_TYPE" 
        }, { status: 400 });
      }
      updates.type = body.type;
    }

    // Update customer ID if provided
    if (body.customerId !== undefined) {
      updates.customerId = body.customerId ? parseInt(body.customerId) : null;
    }

    // Update reference fields if provided
    if (body.referenceId !== undefined) {
      updates.referenceId = body.referenceId ? parseInt(body.referenceId) : null;
    }

    if (body.referenceType !== undefined) {
      updates.referenceType = body.referenceType ? body.referenceType.trim() : null;
    }

    // Update amounts if provided
    let amount = existingInvoice[0].amount;
    let taxAmount = existingInvoice[0].taxAmount;

    if (body.amount !== undefined) {
      if (body.amount < 0) {
        return NextResponse.json({ 
          error: "Amount cannot be negative",
          code: "INVALID_AMOUNT" 
        }, { status: 400 });
      }
      amount = parseInt(body.amount);
      updates.amount = amount;
    }

    if (body.taxAmount !== undefined) {
      if (body.taxAmount < 0) {
        return NextResponse.json({ 
          error: "Tax amount cannot be negative",
          code: "INVALID_TAX_AMOUNT" 
        }, { status: 400 });
      }
      taxAmount = parseInt(body.taxAmount);
      updates.taxAmount = taxAmount;
    }

    // Recalculate total if amounts changed
    if (body.amount !== undefined || body.taxAmount !== undefined) {
      updates.totalAmount = amount + taxAmount;
    }

    // Update status if provided
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = body.status;
    }

    // Update due date if provided
    if (body.dueDate !== undefined) {
      updates.dueDate = body.dueDate || null;
    }

    // Always update timestamp
    updates.updatedAt = Date.now();

    const updatedInvoice = await db.update(invoices)
      .set(updates)
      .where(eq(invoices.id, invoiceId))
      .returning();

    return NextResponse.json(updatedInvoice[0]);

  } catch (error) {
    console.error('PUT error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: "Invoice number already exists",
        code: "DUPLICATE_INVOICE_NUMBER" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const invoiceId = parseInt(id);

    // Check if invoice exists
    const existingInvoice = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(invoices)
      .where(eq(invoices.id, invoiceId))
      .returning();

    return NextResponse.json({ 
      message: 'Invoice deleted successfully',
      deletedInvoice: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}