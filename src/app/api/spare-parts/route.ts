import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { spareParts, vendors } from '@/db/schema';
import { eq, like, or, and, lte, count, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      const sparePartId = parseInt(id);
      if (isNaN(sparePartId)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const sparePart = await db.select()
        .from(spareParts)
        .where(eq(spareParts.id, sparePartId))
        .limit(1);

      if (sparePart.length === 0) {
        return NextResponse.json({ 
          error: 'Spare part not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(sparePart[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendor_id');
    const lowStock = searchParams.get('low_stock');
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    let conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(spareParts.name, `%${search}%`),
          like(spareParts.partNumber, `%${search}%`)
        )
      );
    }

    // Category filter
    if (category) {
      conditions.push(eq(spareParts.category, category));
    }

    // Status filter
    if (status) {
      conditions.push(eq(spareParts.status, status));
    }

    // Vendor filter
    if (vendorId) {
      const vendorIdInt = parseInt(vendorId);
      if (!isNaN(vendorIdInt)) {
        conditions.push(eq(spareParts.vendorId, vendorIdInt));
      }
    }

    // Low stock filter
    if (lowStock === 'true') {
      conditions.push(lte(spareParts.quantity, spareParts.reorderPoint));
    }

    // Build query
    let query = db.select().from(spareParts);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderColumn = sortField === 'name' ? spareParts.name :
                       sortField === 'partNumber' ? spareParts.partNumber :
                       sortField === 'category' ? spareParts.category :
                       sortField === 'quantity' ? spareParts.quantity :
                       sortField === 'unitPrice' ? spareParts.unitPrice :
                       sortField === 'updatedAt' ? spareParts.updatedAt :
                       spareParts.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(orderColumn);
    } else {
      query = query.orderBy(desc(orderColumn));
    }

    // Execute query with pagination
    const results = await query.limit(limit).offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(spareParts);
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
        hasMore: offset + results.length < totalCount[0].count
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      partNumber, 
      name, 
      category, 
      quantity, 
      unitPrice, 
      reorderPoint, 
      vendorId,
      status,
      location 
    } = body;

    // Validate required fields
    if (!partNumber || !partNumber.trim()) {
      return NextResponse.json({ 
        error: 'Part number is required',
        code: 'MISSING_PART_NUMBER' 
      }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    if (!category || !category.trim()) {
      return NextResponse.json({ 
        error: 'Category is required',
        code: 'MISSING_CATEGORY' 
      }, { status: 400 });
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json({ 
        error: 'Quantity is required',
        code: 'MISSING_QUANTITY' 
      }, { status: 400 });
    }

    if (unitPrice === undefined || unitPrice === null) {
      return NextResponse.json({ 
        error: 'Unit price is required',
        code: 'MISSING_UNIT_PRICE' 
      }, { status: 400 });
    }

    if (reorderPoint === undefined || reorderPoint === null) {
      return NextResponse.json({ 
        error: 'Reorder point is required',
        code: 'MISSING_REORDER_POINT' 
      }, { status: 400 });
    }

    // Validate non-negative values
    if (quantity < 0) {
      return NextResponse.json({ 
        error: 'Quantity cannot be negative',
        code: 'INVALID_QUANTITY' 
      }, { status: 400 });
    }

    if (unitPrice < 0) {
      return NextResponse.json({ 
        error: 'Unit price cannot be negative',
        code: 'INVALID_UNIT_PRICE' 
      }, { status: 400 });
    }

    if (reorderPoint < 0) {
      return NextResponse.json({ 
        error: 'Reorder point cannot be negative',
        code: 'INVALID_REORDER_POINT' 
      }, { status: 400 });
    }

    // Validate status if provided
    const validStatuses = ['active', 'inactive', 'discontinued'];
    const finalStatus = status && validStatuses.includes(status) ? status : 'active';

    // Check for duplicate part number
    const existing = await db.select()
      .from(spareParts)
      .where(eq(spareParts.partNumber, partNumber.trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ 
        error: 'Part number already exists',
        code: 'DUPLICATE_PART_NUMBER' 
      }, { status: 400 });
    }

    // Validate vendor exists if provided
    if (vendorId) {
      const vendorExists = await db.select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (vendorExists.length === 0) {
        return NextResponse.json({ 
          error: 'Vendor not found',
          code: 'INVALID_VENDOR_ID' 
        }, { status: 400 });
      }
    }

    // Create spare part
    const timestamp = Date.now();
    const newSparePart = await db.insert(spareParts)
      .values({
        partNumber: partNumber.trim(),
        name: name.trim(),
        category: category.trim(),
        quantity: parseInt(quantity),
        unitPrice: parseInt(unitPrice),
        reorderPoint: parseInt(reorderPoint),
        vendorId: vendorId ? parseInt(vendorId) : null,
        status: finalStatus,
        location: location ? location.trim() : null,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return NextResponse.json(newSparePart[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const sparePartId = parseInt(id);

    // Check if spare part exists
    const existing = await db.select()
      .from(spareParts)
      .where(eq(spareParts.id, sparePartId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Spare part not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      partNumber, 
      name, 
      category, 
      quantity, 
      unitPrice, 
      reorderPoint, 
      vendorId,
      status,
      location 
    } = body;

    const updates: any = {
      updatedAt: Date.now()
    };

    // Validate and update part number if provided
    if (partNumber !== undefined) {
      if (!partNumber.trim()) {
        return NextResponse.json({ 
          error: 'Part number cannot be empty',
          code: 'INVALID_PART_NUMBER' 
        }, { status: 400 });
      }

      // Check for duplicate part number (excluding current record)
      const duplicate = await db.select()
        .from(spareParts)
        .where(
          and(
            eq(spareParts.partNumber, partNumber.trim()),
            eq(spareParts.id, sparePartId)
          )
        )
        .limit(1);

      if (duplicate.length === 0) {
        const otherDuplicate = await db.select()
          .from(spareParts)
          .where(eq(spareParts.partNumber, partNumber.trim()))
          .limit(1);

        if (otherDuplicate.length > 0) {
          return NextResponse.json({ 
            error: 'Part number already exists',
            code: 'DUPLICATE_PART_NUMBER' 
          }, { status: 400 });
        }
      }

      updates.partNumber = partNumber.trim();
    }

    // Validate and update other fields
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ 
          error: 'Name cannot be empty',
          code: 'INVALID_NAME' 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (category !== undefined) {
      if (!category.trim()) {
        return NextResponse.json({ 
          error: 'Category cannot be empty',
          code: 'INVALID_CATEGORY' 
        }, { status: 400 });
      }
      updates.category = category.trim();
    }

    if (quantity !== undefined) {
      if (quantity < 0) {
        return NextResponse.json({ 
          error: 'Quantity cannot be negative',
          code: 'INVALID_QUANTITY' 
        }, { status: 400 });
      }
      updates.quantity = parseInt(quantity);
    }

    if (unitPrice !== undefined) {
      if (unitPrice < 0) {
        return NextResponse.json({ 
          error: 'Unit price cannot be negative',
          code: 'INVALID_UNIT_PRICE' 
        }, { status: 400 });
      }
      updates.unitPrice = parseInt(unitPrice);
    }

    if (reorderPoint !== undefined) {
      if (reorderPoint < 0) {
        return NextResponse.json({ 
          error: 'Reorder point cannot be negative',
          code: 'INVALID_REORDER_POINT' 
        }, { status: 400 });
      }
      updates.reorderPoint = parseInt(reorderPoint);
    }

    if (vendorId !== undefined) {
      if (vendorId === null) {
        updates.vendorId = null;
      } else {
        const vendorExists = await db.select()
          .from(vendors)
          .where(eq(vendors.id, parseInt(vendorId)))
          .limit(1);

        if (vendorExists.length === 0) {
          return NextResponse.json({ 
            error: 'Vendor not found',
            code: 'INVALID_VENDOR_ID' 
          }, { status: 400 });
        }
        updates.vendorId = parseInt(vendorId);
      }
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'inactive', 'discontinued'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status. Must be one of: active, inactive, discontinued',
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = status;
    }

    if (location !== undefined) {
      updates.location = location ? location.trim() : null;
    }

    // Update spare part
    const updated = await db.update(spareParts)
      .set(updates)
      .where(eq(spareParts.id, sparePartId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const sparePartId = parseInt(id);

    // Check if spare part exists
    const existing = await db.select()
      .from(spareParts)
      .where(eq(spareParts.id, sparePartId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Spare part not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete spare part
    const deleted = await db.delete(spareParts)
      .where(eq(spareParts.id, sparePartId))
      .returning();

    return NextResponse.json({
      message: 'Spare part deleted successfully',
      data: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}