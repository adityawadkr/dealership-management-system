import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const appointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, parseInt(id)))
      .limit(1);

    if (appointment.length === 0) {
      return NextResponse.json({ 
        error: "Appointment not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ data: appointment[0] });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingAppointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, parseInt(id)))
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json({ 
        error: "Appointment not found" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { customer, vehicle, date, serviceType, status } = body;

    // Validate customer if provided
    if (customer !== undefined) {
      if (typeof customer !== 'string' || customer.trim().length === 0) {
        return NextResponse.json({ 
          error: "Customer must be a non-empty string",
          code: "INVALID_CUSTOMER" 
        }, { status: 400 });
      }
    }

    // Validate vehicle if provided
    if (vehicle !== undefined) {
      if (typeof vehicle !== 'string' || vehicle.trim().length === 0) {
        return NextResponse.json({ 
          error: "Vehicle must be a non-empty string",
          code: "INVALID_VEHICLE" 
        }, { status: 400 });
      }
    }

    // Validate date if provided
    if (date !== undefined) {
      if (typeof date !== 'string' || isNaN(Date.parse(date))) {
        return NextResponse.json({ 
          error: "Date must be a valid ISO datetime string",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
    }

    // Validate serviceType if provided
    if (serviceType !== undefined) {
      if (typeof serviceType !== 'string' || serviceType.trim().length === 0) {
        return NextResponse.json({ 
          error: "Service type must be a non-empty string",
          code: "INVALID_SERVICE_TYPE" 
        }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['scheduled', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: scheduled, in_progress, completed",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
    }

    const updates: any = {};
    
    if (customer !== undefined) updates.customer = customer.trim();
    if (vehicle !== undefined) updates.vehicle = vehicle.trim();
    if (date !== undefined) updates.date = date;
    if (serviceType !== undefined) updates.serviceType = serviceType.trim();
    if (status !== undefined) updates.status = status;

    const updated = await db.update(appointments)
      .set(updates)
      .where(eq(appointments.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: "Failed to update appointment" 
      }, { status: 500 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingAppointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, parseInt(id)))
      .limit(1);

    if (existingAppointment.length === 0) {
      return NextResponse.json({ 
        error: "Appointment not found" 
      }, { status: 404 });
    }

    const deleted = await db.delete(appointments)
      .where(eq(appointments.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: "Failed to delete appointment" 
      }, { status: 500 });
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