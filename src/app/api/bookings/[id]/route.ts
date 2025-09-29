import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const booking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ data: booking[0] }, { status: 200 });
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
    const { customer, vehicle, quotationNo, date, status } = requestBody;

    // Validate inputs if provided
    if (customer !== undefined && (!customer || typeof customer !== 'string' || customer.trim() === '')) {
      return NextResponse.json({ 
        error: "Customer must be a non-empty string",
        code: "INVALID_CUSTOMER" 
      }, { status: 400 });
    }

    if (vehicle !== undefined && (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '')) {
      return NextResponse.json({ 
        error: "Vehicle must be a non-empty string",
        code: "INVALID_VEHICLE" 
      }, { status: 400 });
    }

    if (quotationNo !== undefined && (!quotationNo || typeof quotationNo !== 'string' || quotationNo.trim() === '')) {
      return NextResponse.json({ 
        error: "Quotation number must be a non-empty string",
        code: "INVALID_QUOTATION_NO" 
      }, { status: 400 });
    }

    if (date !== undefined) {
      if (!date || typeof date !== 'string') {
        return NextResponse.json({ 
          error: "Date must be a valid ISO date string",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
      
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime()) || date !== dateObj.toISOString()) {
        return NextResponse.json({ 
          error: "Date must be a valid ISO date string",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
    }

    if (status !== undefined && !['booked', 'cancelled', 'delivered'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be one of: booked, cancelled, delivered",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Check if booking exists
    const existingBooking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare update data
    const updates: any = {};
    if (customer !== undefined) updates.customer = customer.trim();
    if (vehicle !== undefined) updates.vehicle = vehicle.trim();
    if (quotationNo !== undefined) updates.quotationNo = quotationNo.trim();
    if (date !== undefined) updates.date = date;
    if (status !== undefined) updates.status = status;

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: existingBooking[0] }, { status: 200 });
    }

    const updated = await db.update(bookings)
      .set(updates)
      .where(eq(bookings.id, parseInt(id)))
      .returning();

    return NextResponse.json({ data: updated[0] }, { status: 200 });
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

    // Check if booking exists
    const existingBooking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const deleted = await db.delete(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      data: { message: "success" }
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}