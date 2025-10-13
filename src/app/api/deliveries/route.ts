import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveries, bookings } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

const VALID_RTO_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_INSURANCE_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_QC_STATUSES = ['pending', 'in-progress', 'completed', 'failed'];
const VALID_DELIVERY_STATUSES = ['in_progress', 'ready', 'delivered', 'cancelled'];

function validateStatusFields(data: any): { valid: boolean; error?: string } {
  if (data.rtoStatus && !VALID_RTO_STATUSES.includes(data.rtoStatus)) {
    return { valid: false, error: `Invalid rtoStatus. Must be one of: ${VALID_RTO_STATUSES.join(', ')}` };
  }
  if (data.insuranceStatus && !VALID_INSURANCE_STATUSES.includes(data.insuranceStatus)) {
    return { valid: false, error: `Invalid insuranceStatus. Must be one of: ${VALID_INSURANCE_STATUSES.join(', ')}` };
  }
  if (data.qcStatus && !VALID_QC_STATUSES.includes(data.qcStatus)) {
    return { valid: false, error: `Invalid qcStatus. Must be one of: ${VALID_QC_STATUSES.join(', ')}` };
  }
  if (data.status && !VALID_DELIVERY_STATUSES.includes(data.status)) {
    return { valid: false, error: `Invalid status. Must be one of: ${VALID_DELIVERY_STATUSES.join(', ')}` };
  }
  return { valid: true };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const deliveryId = parseInt(id);
      if (isNaN(deliveryId)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const delivery = await db.select()
        .from(deliveries)
        .where(eq(deliveries.id, deliveryId))
        .limit(1);

      if (delivery.length === 0) {
        return NextResponse.json({ 
          error: 'Delivery not found',
          code: 'DELIVERY_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(delivery[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusFilter = searchParams.get('status');
    const rtoStatusFilter = searchParams.get('rto_status');
    const bookingIdFilter = searchParams.get('booking_id');

    let query = db.select().from(deliveries);
    let countQuery = db.select({ count: count() }).from(deliveries);

    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(deliveries.status, statusFilter));
    }
    if (rtoStatusFilter) {
      conditions.push(eq(deliveries.rtoStatus, rtoStatusFilter));
    }
    if (bookingIdFilter) {
      const bookingId = parseInt(bookingIdFilter);
      if (!isNaN(bookingId)) {
        conditions.push(eq(deliveries.bookingId, bookingId));
      }
    }

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const results = await query.limit(limit).offset(offset);
    const totalCount = await countQuery;

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount[0].count,
        limit,
        offset,
        hasMore: offset + results.length < totalCount[0].count
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
    const { bookingId, vehicleVin, rtoStatus, rtoNumber, insuranceStatus, insurancePolicy, qcStatus, qcNotes, handoverDate, documentsJson, status } = body;

    if (!bookingId) {
      return NextResponse.json({ 
        error: 'bookingId is required',
        code: 'MISSING_BOOKING_ID' 
      }, { status: 400 });
    }

    const bookingIdInt = parseInt(bookingId);
    if (isNaN(bookingIdInt)) {
      return NextResponse.json({ 
        error: 'bookingId must be a valid integer',
        code: 'INVALID_BOOKING_ID' 
      }, { status: 400 });
    }

    const bookingExists = await db.select()
      .from(bookings)
      .where(eq(bookings.id, bookingIdInt))
      .limit(1);

    if (bookingExists.length === 0) {
      return NextResponse.json({ 
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND' 
      }, { status: 400 });
    }

    const existingDelivery = await db.select()
      .from(deliveries)
      .where(eq(deliveries.bookingId, bookingIdInt))
      .limit(1);

    if (existingDelivery.length > 0) {
      return NextResponse.json({ 
        error: 'Delivery already exists for this booking',
        code: 'DUPLICATE_BOOKING_ID' 
      }, { status: 400 });
    }

    const validationResult = validateStatusFields({ rtoStatus, insuranceStatus, qcStatus, status });
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: validationResult.error,
        code: 'INVALID_STATUS_VALUE' 
      }, { status: 400 });
    }

    if (documentsJson && typeof documentsJson === 'string') {
      try {
        JSON.parse(documentsJson);
      } catch (e) {
        return NextResponse.json({ 
          error: 'documentsJson must be a valid JSON string',
          code: 'INVALID_JSON' 
        }, { status: 400 });
      }
    }

    const now = Date.now();
    const insertData = {
      bookingId: bookingIdInt,
      vehicleVin: vehicleVin || null,
      rtoStatus: rtoStatus || 'pending',
      rtoNumber: rtoNumber || null,
      insuranceStatus: insuranceStatus || 'pending',
      insurancePolicy: insurancePolicy || null,
      qcStatus: qcStatus || 'pending',
      qcNotes: qcNotes || null,
      handoverDate: handoverDate || null,
      documentsJson: documentsJson || null,
      status: status || 'in_progress',
      createdAt: now,
      updatedAt: now
    };

    const newDelivery = await db.insert(deliveries)
      .values(insertData)
      .returning();

    return NextResponse.json(newDelivery[0], { status: 201 });
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

    if (!id) {
      return NextResponse.json({ 
        error: 'ID parameter is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    const deliveryId = parseInt(id);
    if (isNaN(deliveryId)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existingDelivery = await db.select()
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .limit(1);

    if (existingDelivery.length === 0) {
      return NextResponse.json({ 
        error: 'Delivery not found',
        code: 'DELIVERY_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { bookingId, vehicleVin, rtoStatus, rtoNumber, insuranceStatus, insurancePolicy, qcStatus, qcNotes, handoverDate, documentsJson, status } = body;

    if (bookingId !== undefined) {
      return NextResponse.json({ 
        error: 'bookingId cannot be updated',
        code: 'BOOKING_ID_IMMUTABLE' 
      }, { status: 400 });
    }

    const validationResult = validateStatusFields({ rtoStatus, insuranceStatus, qcStatus, status });
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: validationResult.error,
        code: 'INVALID_STATUS_VALUE' 
      }, { status: 400 });
    }

    if (documentsJson && typeof documentsJson === 'string') {
      try {
        JSON.parse(documentsJson);
      } catch (e) {
        return NextResponse.json({ 
          error: 'documentsJson must be a valid JSON string',
          code: 'INVALID_JSON' 
        }, { status: 400 });
      }
    }

    const updateData: any = {
      updatedAt: Date.now()
    };

    if (vehicleVin !== undefined) updateData.vehicleVin = vehicleVin;
    if (rtoStatus !== undefined) updateData.rtoStatus = rtoStatus;
    if (rtoNumber !== undefined) updateData.rtoNumber = rtoNumber;
    if (insuranceStatus !== undefined) updateData.insuranceStatus = insuranceStatus;
    if (insurancePolicy !== undefined) updateData.insurancePolicy = insurancePolicy;
    if (qcStatus !== undefined) updateData.qcStatus = qcStatus;
    if (qcNotes !== undefined) updateData.qcNotes = qcNotes;
    if (handoverDate !== undefined) updateData.handoverDate = handoverDate;
    if (documentsJson !== undefined) updateData.documentsJson = documentsJson;
    if (status !== undefined) updateData.status = status;

    const updated = await db.update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, deliveryId))
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

    if (!id) {
      return NextResponse.json({ 
        error: 'ID parameter is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    const deliveryId = parseInt(id);
    if (isNaN(deliveryId)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existingDelivery = await db.select()
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .limit(1);

    if (existingDelivery.length === 0) {
      return NextResponse.json({ 
        error: 'Delivery not found',
        code: 'DELIVERY_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .returning();

    return NextResponse.json({
      message: 'Delivery deleted successfully',
      deleted: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}