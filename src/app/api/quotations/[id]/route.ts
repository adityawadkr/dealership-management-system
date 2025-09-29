import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotations } from '@/db/schema';
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

    const quotation = await db.select()
      .from(quotations)
      .where(eq(quotations.id, parseInt(id)))
      .limit(1);

    if (quotation.length === 0) {
      return NextResponse.json({ 
        error: 'Quotation not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ data: quotation[0] });
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
    const { number, customer, vehicle, amount, status } = requestBody;

    // Check if quotation exists
    const existingQuotation = await db.select()
      .from(quotations)
      .where(eq(quotations.id, parseInt(id)))
      .limit(1);

    if (existingQuotation.length === 0) {
      return NextResponse.json({ 
        error: 'Quotation not found' 
      }, { status: 404 });
    }

    // Validation
    const updates: any = {};

    if (number !== undefined) {
      if (!number || typeof number !== 'string' || number.trim() === '') {
        return NextResponse.json({ 
          error: "Number must be a non-empty string",
          code: "INVALID_NUMBER" 
        }, { status: 400 });
      }

      // Check uniqueness only if number is being changed
      if (number !== existingQuotation[0].number) {
        const existingNumber = await db.select()
          .from(quotations)
          .where(and(eq(quotations.number, number.trim())))
          .limit(1);

        if (existingNumber.length > 0) {
          return NextResponse.json({ 
            error: "Number must be unique",
            code: "DUPLICATE_NUMBER" 
          }, { status: 400 });
        }
      }

      updates.number = number.trim();
    }

    if (customer !== undefined) {
      if (!customer || typeof customer !== 'string' || customer.trim() === '') {
        return NextResponse.json({ 
          error: "Customer must be a non-empty string",
          code: "INVALID_CUSTOMER" 
        }, { status: 400 });
      }
      updates.customer = customer.trim();
    }

    if (vehicle !== undefined) {
      if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
        return NextResponse.json({ 
          error: "Vehicle must be a non-empty string",
          code: "INVALID_VEHICLE" 
        }, { status: 400 });
      }
      updates.vehicle = vehicle.trim();
    }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
        return NextResponse.json({ 
          error: "Amount must be a positive integer",
          code: "INVALID_AMOUNT" 
        }, { status: 400 });
      }
      updates.amount = amount;
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'sent', 'accepted'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: draft, sent, accepted",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = status;
    }

    // If no updates provided, return current record
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: existingQuotation[0] });
    }

    const updated = await db.update(quotations)
      .set(updates)
      .where(eq(quotations.id, parseInt(id)))
      .returning();

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

    // Check if quotation exists
    const existingQuotation = await db.select()
      .from(quotations)
      .where(eq(quotations.id, parseInt(id)))
      .limit(1);

    if (existingQuotation.length === 0) {
      return NextResponse.json({ 
        error: 'Quotation not found' 
      }, { status: 404 });
    }

    const deleted = await db.delete(quotations)
      .where(eq(quotations.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      data: { message: 'success' }
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}