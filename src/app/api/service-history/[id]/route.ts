import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const record = await db.select()
      .from(serviceHistory)
      .where(eq(serviceHistory.id, parseInt(id)))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: 'Service history record not found' }, { status: 404 });
    }

    return NextResponse.json({ data: record[0] });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { customer, vehicle, jobNo, date, amount } = requestBody;

    // Validation
    if (customer !== undefined && (!customer || customer.trim() === '')) {
      return NextResponse.json({ 
        error: "Customer must be a non-empty string",
        code: "INVALID_CUSTOMER" 
      }, { status: 400 });
    }

    if (vehicle !== undefined && (!vehicle || vehicle.trim() === '')) {
      return NextResponse.json({ 
        error: "Vehicle must be a non-empty string",
        code: "INVALID_VEHICLE" 
      }, { status: 400 });
    }

    if (jobNo !== undefined && (!jobNo || jobNo.trim() === '')) {
      return NextResponse.json({ 
        error: "Job number must be a non-empty string",
        code: "INVALID_JOB_NO" 
      }, { status: 400 });
    }

    if (date !== undefined) {
      if (!date || date.trim() === '') {
        return NextResponse.json({ 
          error: "Date must be a non-empty string",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
      
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ 
          error: "Date must be a valid ISO date string",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }
    }

    if (amount !== undefined && (!amount || amount.trim() === '')) {
      return NextResponse.json({ 
        error: "Amount must be a non-empty string",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(serviceHistory)
      .where(eq(serviceHistory.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Service history record not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (customer !== undefined) updateData.customer = customer.trim();
    if (vehicle !== undefined) updateData.vehicle = vehicle.trim();
    if (jobNo !== undefined) updateData.jobNo = jobNo.trim();
    if (date !== undefined) updateData.date = date.trim();
    if (amount !== undefined) updateData.amount = amount.trim();

    // Update record
    const updated = await db.update(serviceHistory)
      .set(updateData)
      .where(eq(serviceHistory.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Failed to update service history record' }, { status: 500 });
    }

    return NextResponse.json({ data: updated[0] });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
      .from(serviceHistory)
      .where(eq(serviceHistory.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Service history record not found' }, { status: 404 });
    }

    // Delete record
    const deleted = await db.delete(serviceHistory)
      .where(eq(serviceHistory.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Failed to delete service history record' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: { 
        message: "success"
      } 
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}