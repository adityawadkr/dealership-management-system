import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobCards, appointments } from '@/db/schema';
import { eq, like, and, or, desc, asc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }
      
      const record = await db.select()
        .from(jobCards)
        .where(eq(jobCards.id, parseInt(id)))
        .limit(1);
      
      if (record.length === 0) {
        return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
      }
      
      return NextResponse.json({ data: record[0] }, { status: 200 });
    }
    
    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const appointmentId = searchParams.get('appointment_id');
    
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(jobCards.status, status));
    }
    
    if (appointmentId) {
      const appointmentIdInt = parseInt(appointmentId);
      if (!isNaN(appointmentIdInt)) {
        whereConditions.push(eq(jobCards.appointmentId, appointmentIdInt));
      }
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Get total count for pagination
    const totalResult = await db.select({ count: count() })
      .from(jobCards)
      .where(whereClause);
    
    const total = totalResult[0].count;
    
    // Get records
    let query = db.select().from(jobCards);
    
    if (whereClause) {
      query = query.where(whereClause);
    }
    
    const results = await query
      .orderBy(desc(jobCards.createdAt))
      .limit(limit)
      .offset(offset);
    
    const pageSize = limit;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      data: results,
      meta: {
        total,
        page,
        pageSize,
        totalPages
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
    const requestBody = await request.json();
    const { jobNo, appointmentId, technician, partsUsed, notes, status } = requestBody;
    
    // Validate required fields
    if (!jobNo || typeof jobNo !== 'string' || jobNo.trim() === '') {
      return NextResponse.json({ 
        error: "Job number is required and must be a non-empty string",
        code: "MISSING_JOB_NO" 
      }, { status: 400 });
    }
    
    if (!technician || typeof technician !== 'string' || technician.trim() === '') {
      return NextResponse.json({ 
        error: "Technician is required and must be a non-empty string",
        code: "MISSING_TECHNICIAN" 
      }, { status: 400 });
    }
    
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ 
        error: "Status is required",
        code: "MISSING_STATUS" 
      }, { status: 400 });
    }
    
    // Validate status enum
    if (!['open', 'closed'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be one of: open, closed",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }
    
    // Validate appointmentId if provided
    let validatedAppointmentId = null;
    if (appointmentId !== undefined && appointmentId !== null) {
      if (typeof appointmentId !== 'number' || isNaN(appointmentId)) {
        return NextResponse.json({ 
          error: "Appointment ID must be a valid integer",
          code: "INVALID_APPOINTMENT_ID" 
        }, { status: 400 });
      }
      
      // Check if appointment exists
      const appointmentExists = await db.select({ id: appointments.id })
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);
      
      if (appointmentExists.length === 0) {
        return NextResponse.json({ 
          error: "Referenced appointment does not exist",
          code: "APPOINTMENT_NOT_FOUND" 
        }, { status: 400 });
      }
      
      validatedAppointmentId = appointmentId;
    }
    
    // Prepare insert data
    const insertData = {
      jobNo: jobNo.trim(),
      appointmentId: validatedAppointmentId,
      technician: technician.trim(),
      partsUsed: partsUsed ? partsUsed.trim() : null,
      notes: notes ? notes.trim() : null,
      status,
      createdAt: Date.now()
    };
    
    // Insert with returning
    const newRecord = await db.insert(jobCards)
      .values(insertData)
      .returning();
    
    return NextResponse.json({ data: newRecord[0] }, { status: 201 });
    
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed: job_cards.job_no')) {
      return NextResponse.json({ 
        error: "Job number already exists. Please use a unique job number.",
        code: "DUPLICATE_JOB_NO" 
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
    
    const requestBody = await request.json();
    const { jobNo, appointmentId, technician, partsUsed, notes, status } = requestBody;
    
    // Check if record exists
    const existingRecord = await db.select()
      .from(jobCards)
      .where(eq(jobCards.id, parseInt(id)))
      .limit(1);
    
    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }
    
    const updates: any = {};
    
    // Validate and update fields
    if (jobNo !== undefined) {
      if (typeof jobNo !== 'string' || jobNo.trim() === '') {
        return NextResponse.json({ 
          error: "Job number must be a non-empty string",
          code: "INVALID_JOB_NO" 
        }, { status: 400 });
      }
      updates.jobNo = jobNo.trim();
    }
    
    if (technician !== undefined) {
      if (typeof technician !== 'string' || technician.trim() === '') {
        return NextResponse.json({ 
          error: "Technician must be a non-empty string",
          code: "INVALID_TECHNICIAN" 
        }, { status: 400 });
      }
      updates.technician = technician.trim();
    }
    
    if (status !== undefined) {
      if (!['open', 'closed'].includes(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: open, closed",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = status;
    }
    
    if (appointmentId !== undefined) {
      if (appointmentId === null) {
        updates.appointmentId = null;
      } else {
        if (typeof appointmentId !== 'number' || isNaN(appointmentId)) {
          return NextResponse.json({ 
            error: "Appointment ID must be a valid integer or null",
            code: "INVALID_APPOINTMENT_ID" 
          }, { status: 400 });
        }
        
        // Check if appointment exists
        const appointmentExists = await db.select({ id: appointments.id })
          .from(appointments)
          .where(eq(appointments.id, appointmentId))
          .limit(1);
        
        if (appointmentExists.length === 0) {
          return NextResponse.json({ 
            error: "Referenced appointment does not exist",
            code: "APPOINTMENT_NOT_FOUND" 
          }, { status: 400 });
        }
        
        updates.appointmentId = appointmentId;
      }
    }
    
    if (partsUsed !== undefined) {
      updates.partsUsed = partsUsed ? partsUsed.trim() : null;
    }
    
    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }
    
    // Update record
    const updated = await db.update(jobCards)
      .set(updates)
      .where(eq(jobCards.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({ data: updated[0] }, { status: 200 });
    
  } catch (error) {
    console.error('PUT error:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed: job_cards.job_no')) {
      return NextResponse.json({ 
        error: "Job number already exists. Please use a unique job number.",
        code: "DUPLICATE_JOB_NO" 
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
    
    // Check if record exists
    const existingRecord = await db.select()
      .from(jobCards)
      .where(eq(jobCards.id, parseInt(id)))
      .limit(1);
    
    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }
    
    // Delete record
    const deleted = await db.delete(jobCards)
      .where(eq(jobCards.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({ 
      message: 'Job card deleted successfully',
      data: deleted[0] 
    }, { status: 200 });
    
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}