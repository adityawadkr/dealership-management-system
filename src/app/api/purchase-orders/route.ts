import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrders, vendors } from '@/db/schema';
import { eq, like, and, gte, lte, count, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];

function validateStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

function validateItemsJson(itemsJson: string): boolean {
  try {
    const items = JSON.parse(itemsJson);
    if (!Array.isArray(items)) return false;
    
    return items.every(item => 
      item.partId !== undefined &&
      item.partName &&
      typeof item.quantity === 'number' &&
      typeof item.unitPrice === 'number' &&
      typeof item.totalPrice === 'number'
    );
  } catch {
    return false;
  }
}

async function validateVendorExists(vendorId: number): Promise<boolean> {
  const vendor = await db.select()
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1);
  return vendor.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const purchaseOrderId = parseInt(id);
      if (isNaN(purchaseOrderId)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const purchaseOrder = await db.select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .limit(1);

      if (purchaseOrder.length === 0) {
        return NextResponse.json({ 
          error: 'Purchase order not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(purchaseOrder[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const q = searchParams.get('q');
    const vendorId = searchParams.get('vendor_id');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const conditions = [];

    if (q) {
      conditions.push(like(purchaseOrders.poNumber, `%${q}%`));
    }

    if (vendorId) {
      const parsedVendorId = parseInt(vendorId);
      if (!isNaN(parsedVendorId)) {
        conditions.push(eq(purchaseOrders.vendorId, parsedVendorId));
      }
    }

    if (status && validateStatus(status)) {
      conditions.push(eq(purchaseOrders.status, status));
    }

    if (from) {
      conditions.push(gte(purchaseOrders.orderedDate, from));
    }

    if (to) {
      conditions.push(lte(purchaseOrders.orderedDate, to));
    }

    let query = db.select().from(purchaseOrders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const sortColumn = sort === 'totalAmount' ? purchaseOrders.totalAmount :
                       sort === 'status' ? purchaseOrders.status :
                       sort === 'orderedDate' ? purchaseOrders.orderedDate :
                       purchaseOrders.createdAt;

    if (order === 'asc') {
      query = query.orderBy(sortColumn);
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    const results = await query.limit(limit).offset(offset);

    let totalQuery = db.select({ count: count() }).from(purchaseOrders);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions));
    }
    const totalResult = await totalQuery;
    const total = totalResult[0].count;

    return NextResponse.json({
      data: results,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + results.length < total
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      poNumber, 
      vendorId, 
      itemsJson, 
      totalAmount,
      status = 'draft',
      orderedDate,
      expectedDeliveryDate
    } = body;

    if (!poNumber || !poNumber.trim()) {
      return NextResponse.json({ 
        error: 'PO number is required',
        code: 'MISSING_PO_NUMBER' 
      }, { status: 400 });
    }

    if (!vendorId) {
      return NextResponse.json({ 
        error: 'Vendor ID is required',
        code: 'MISSING_VENDOR_ID' 
      }, { status: 400 });
    }

    if (!itemsJson) {
      return NextResponse.json({ 
        error: 'Items JSON is required',
        code: 'MISSING_ITEMS_JSON' 
      }, { status: 400 });
    }

    if (totalAmount === undefined || totalAmount === null) {
      return NextResponse.json({ 
        error: 'Total amount is required',
        code: 'MISSING_TOTAL_AMOUNT' 
      }, { status: 400 });
    }

    if (totalAmount < 0) {
      return NextResponse.json({ 
        error: 'Total amount must be greater than or equal to 0',
        code: 'INVALID_TOTAL_AMOUNT' 
      }, { status: 400 });
    }

    if (!validateItemsJson(itemsJson)) {
      return NextResponse.json({ 
        error: 'Items JSON is invalid. Must be an array with partId, partName, quantity, unitPrice, and totalPrice',
        code: 'INVALID_ITEMS_JSON' 
      }, { status: 400 });
    }

    if (!validateStatus(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const vendorExists = await validateVendorExists(vendorId);
    if (!vendorExists) {
      return NextResponse.json({ 
        error: 'Vendor does not exist',
        code: 'VENDOR_NOT_FOUND' 
      }, { status: 400 });
    }

    const existingPO = await db.select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.poNumber, poNumber.trim()))
      .limit(1);

    if (existingPO.length > 0) {
      return NextResponse.json({ 
        error: 'PO number already exists',
        code: 'DUPLICATE_PO_NUMBER' 
      }, { status: 400 });
    }

    const now = Date.now();
    
    const newPurchaseOrder = await db.insert(purchaseOrders)
      .values({
        poNumber: poNumber.trim(),
        vendorId,
        itemsJson,
        totalAmount,
        status,
        orderedDate: orderedDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        receivedDate: null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newPurchaseOrder[0], { status: 201 });

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

    const purchaseOrderId = parseInt(id);

    const existing = await db.select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Purchase order not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    if (body.poNumber !== undefined) {
      if (!body.poNumber.trim()) {
        return NextResponse.json({ 
          error: 'PO number cannot be empty',
          code: 'INVALID_PO_NUMBER' 
        }, { status: 400 });
      }

      if (body.poNumber.trim() !== existing[0].poNumber) {
        const existingPO = await db.select()
          .from(purchaseOrders)
          .where(eq(purchaseOrders.poNumber, body.poNumber.trim()))
          .limit(1);

        if (existingPO.length > 0) {
          return NextResponse.json({ 
            error: 'PO number already exists',
            code: 'DUPLICATE_PO_NUMBER' 
          }, { status: 400 });
        }
      }

      updates.poNumber = body.poNumber.trim();
    }

    if (body.vendorId !== undefined) {
      const vendorExists = await validateVendorExists(body.vendorId);
      if (!vendorExists) {
        return NextResponse.json({ 
          error: 'Vendor does not exist',
          code: 'VENDOR_NOT_FOUND' 
        }, { status: 400 });
      }
      updates.vendorId = body.vendorId;
    }

    if (body.itemsJson !== undefined) {
      if (!validateItemsJson(body.itemsJson)) {
        return NextResponse.json({ 
          error: 'Items JSON is invalid. Must be an array with partId, partName, quantity, unitPrice, and totalPrice',
          code: 'INVALID_ITEMS_JSON' 
        }, { status: 400 });
      }
      updates.itemsJson = body.itemsJson;
    }

    if (body.totalAmount !== undefined) {
      if (body.totalAmount < 0) {
        return NextResponse.json({ 
          error: 'Total amount must be greater than or equal to 0',
          code: 'INVALID_TOTAL_AMOUNT' 
        }, { status: 400 });
      }
      updates.totalAmount = body.totalAmount;
    }

    if (body.status !== undefined) {
      if (!validateStatus(body.status)) {
        return NextResponse.json({ 
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.orderedDate !== undefined) {
      updates.orderedDate = body.orderedDate;
    }

    if (body.expectedDeliveryDate !== undefined) {
      updates.expectedDeliveryDate = body.expectedDeliveryDate;
    }

    if (body.receivedDate !== undefined) {
      updates.receivedDate = body.receivedDate;
    }

    updates.updatedAt = Date.now();

    const updated = await db.update(purchaseOrders)
      .set(updates)
      .where(eq(purchaseOrders.id, purchaseOrderId))
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

    const purchaseOrderId = parseInt(id);

    const existing = await db.select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Purchase order not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .returning();

    return NextResponse.json({
      message: 'Purchase order deleted successfully',
      deletedRecord: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}