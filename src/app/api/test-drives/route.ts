import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { testDrives, leads, vehicles } from '@/db/schema';
import { eq, like, or, and, gte, lte, count } from 'drizzle-orm';

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show'];

// GET - List test drives with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Filters
    const vehicleId = searchParams.get('vehicle_id');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const search = searchParams.get('q');
    
    // Build where conditions
    const conditions = [];
    
    if (vehicleId) {
      conditions.push(eq(testDrives.vehicleId, parseInt(vehicleId)));
    }
    
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(testDrives.status, status));
    }
    
    if (from) {
      conditions.push(gte(testDrives.scheduledDate, from));
    }
    
    if (to) {
      conditions.push(lte(testDrives.scheduledDate, to));
    }
    
    if (search) {
      conditions.push(
        or(
          like(testDrives.customerName, `%${search}%`),
          like(testDrives.customerPhone, `%${search}%`)
        )
      );
    }
    
    // Build query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count
    const totalQuery = whereClause 
      ? db.select({ count: count() }).from(testDrives).where(whereClause)
      : db.select({ count: count() }).from(testDrives);
    
    const totalResult = await totalQuery;
    const total = totalResult[0].count;
    
    // Get paginated results
    let query = db.select().from(testDrives);
    
    if (whereClause) {
      query = query.where(whereClause);
    }
    
    const results = await query
      .orderBy(testDrives.scheduledDate)
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

// POST - Create new test drive booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      leadId,
      customerName,
      customerPhone,
      vehicleId,
      scheduledDate,
      timeSlot,
      licenseNumber,
      licenseVerified = false,
      status = 'scheduled',
      feedback
    } = body;
    
    // Validate required fields
    if (!customerName) {
      return NextResponse.json({ 
        error: "Customer name is required",
        code: "MISSING_CUSTOMER_NAME" 
      }, { status: 400 });
    }
    
    if (!customerPhone) {
      return NextResponse.json({ 
        error: "Customer phone is required",
        code: "MISSING_CUSTOMER_PHONE" 
      }, { status: 400 });
    }
    
    if (!scheduledDate) {
      return NextResponse.json({ 
        error: "Scheduled date is required",
        code: "MISSING_SCHEDULED_DATE" 
      }, { status: 400 });
    }
    
    if (!timeSlot) {
      return NextResponse.json({ 
        error: "Time slot is required",
        code: "MISSING_TIME_SLOT" 
      }, { status: 400 });
    }
    
    if (!licenseNumber) {
      return NextResponse.json({ 
        error: "License number is required",
        code: "MISSING_LICENSE_NUMBER" 
      }, { status: 400 });
    }
    
    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }
    
    // Validate leadId if provided
    if (leadId) {
      const leadExists = await db.select({ id: leads.id })
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);
      
      if (leadExists.length === 0) {
        return NextResponse.json({ 
          error: "Lead not found",
          code: "INVALID_LEAD_ID" 
        }, { status: 400 });
      }
    }
    
    // Validate vehicleId if provided
    if (vehicleId) {
      const vehicleExists = await db.select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId))
        .limit(1);
      
      if (vehicleExists.length === 0) {
        return NextResponse.json({ 
          error: "Vehicle not found",
          code: "INVALID_VEHICLE_ID" 
        }, { status: 400 });
      }
    }
    
    // Validate scheduledDate is valid ISO date
    const dateCheck = new Date(scheduledDate);
    if (isNaN(dateCheck.getTime())) {
      return NextResponse.json({ 
        error: "Invalid scheduled date format. Use ISO format (YYYY-MM-DD or ISO datetime)",
        code: "INVALID_DATE_FORMAT" 
      }, { status: 400 });
    }
    
    const now = Date.now();
    
    // Create test drive
    const newTestDrive = await db.insert(testDrives)
      .values({
        leadId: leadId || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        vehicleId: vehicleId || null,
        scheduledDate,
        timeSlot: timeSlot.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseVerified: licenseVerified ? 1 : 0,
        status,
        feedback: feedback?.trim() || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    return NextResponse.json(newTestDrive[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT - Update test drive by id
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }
    
    // Check if test drive exists
    const existing = await db.select()
      .from(testDrives)
      .where(eq(testDrives.id, parseInt(id)))
      .limit(1);
    
    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Test drive not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }
    
    const body = await request.json();
    
    const {
      leadId,
      customerName,
      customerPhone,
      vehicleId,
      scheduledDate,
      timeSlot,
      licenseNumber,
      licenseVerified,
      status,
      feedback
    } = body;
    
    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }
    
    // Validate leadId if provided
    if (leadId !== undefined && leadId !== null) {
      const leadExists = await db.select({ id: leads.id })
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);
      
      if (leadExists.length === 0) {
        return NextResponse.json({ 
          error: "Lead not found",
          code: "INVALID_LEAD_ID" 
        }, { status: 400 });
      }
    }
    
    // Validate vehicleId if provided
    if (vehicleId !== undefined && vehicleId !== null) {
      const vehicleExists = await db.select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId))
        .limit(1);
      
      if (vehicleExists.length === 0) {
        return NextResponse.json({ 
          error: "Vehicle not found",
          code: "INVALID_VEHICLE_ID" 
        }, { status: 400 });
      }
    }
    
    // Validate scheduledDate if provided
    if (scheduledDate) {
      const dateCheck = new Date(scheduledDate);
      if (isNaN(dateCheck.getTime())) {
        return NextResponse.json({ 
          error: "Invalid scheduled date format. Use ISO format (YYYY-MM-DD or ISO datetime)",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }
    }
    
    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now()
    };
    
    if (leadId !== undefined) updates.leadId = leadId;
    if (customerName !== undefined) updates.customerName = customerName.trim();
    if (customerPhone !== undefined) updates.customerPhone = customerPhone.trim();
    if (vehicleId !== undefined) updates.vehicleId = vehicleId;
    if (scheduledDate !== undefined) updates.scheduledDate = scheduledDate;
    if (timeSlot !== undefined) updates.timeSlot = timeSlot.trim();
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber.trim();
    if (licenseVerified !== undefined) updates.licenseVerified = licenseVerified ? 1 : 0;
    if (status !== undefined) updates.status = status;
    if (feedback !== undefined) updates.feedback = feedback?.trim() || null;
    
    const updated = await db.update(testDrives)
      .set(updates)
      .where(eq(testDrives.id, parseInt(id)))
      .returning();
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE - Delete test drive by id
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }
    
    // Check if test drive exists
    const existing = await db.select()
      .from(testDrives)
      .where(eq(testDrives.id, parseInt(id)))
      .limit(1);
    
    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Test drive not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }
    
    const deleted = await db.delete(testDrives)
      .where(eq(testDrives.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      message: 'Test drive deleted successfully',
      data: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}