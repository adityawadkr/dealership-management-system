import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobCards } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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
      return NextResponse.json({ 
        error: 'Job card not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ data: record[0] });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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
      return NextResponse.json({ 
        error: 'Job card not found' 
      }, { status: 404 });
    }

    // Validation
    if (jobNo !== undefined) {
      if (typeof jobNo !== 'string' || jobNo.trim() === '') {
        return NextResponse.json({ 
          error: "Job number must be a non-empty string",
          code: "INVALID_JOB_NO" 
        }, { status: 400 });
      }

      // Check uniqueness if jobNo is being changed
      if (jobNo !== existingRecord[0].jobNo) {
        const existingJobNo = await db.select()
          .from(jobCards)
          .where(eq(jobCards.jobNo, jobNo.trim()))
          .limit(1);

        if (existingJobNo.length > 0) {
          return NextResponse.json({ 
            error: "Job number must be unique",
            code: "DUPLICATE_JOB_NO" 
          }, { status: 400 });
        }
      }
    }

    if (appointmentId !== undefined && appointmentId !== null) {
      if (typeof appointmentId !== 'number' || isNaN(appointmentId)) {
        return NextResponse.json({ 
          error: "Appointment ID must be a valid integer or null",
          code: "INVALID_APPOINTMENT_ID" 
        }, { status: 400 });
      }
    }

    if (technician !== undefined) {
      if (typeof technician !== 'string' || technician.trim() === '') {
        return NextResponse.json({ 
          error: "Technician must be a non-empty string",
          code: "INVALID_TECHNICIAN" 
        }, { status: 400 });
      }
    }

    if (status !== undefined) {
      if (!['open', 'closed'].includes(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: open, closed",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updates: any = {};
    
    if (jobNo !== undefined) updates.jobNo = jobNo.trim();
    if (appointmentId !== undefined) updates.appointmentId = appointmentId;
    if (technician !== undefined) updates.technician = technician.trim();
    if (partsUsed !== undefined) updates.partsUsed = partsUsed;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    // Always update updatedAt
    updates.updatedAt = Date.now();

    const updated = await db.update(jobCards)
      .set(updates)
      .where(eq(jobCards.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Job card not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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
      return NextResponse.json({ 
        error: 'Job card not found' 
      }, { status: 404 });
    }

    const deleted = await db.delete(jobCards)
      .where(eq(jobCards.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Job card not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      data: { message: "success" }
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}