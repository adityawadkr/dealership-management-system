import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotations } from '@/db/schema';
import { eq, like, and, or, desc, count } from 'drizzle-orm';

const VALID_STATUSES = ['draft', 'sent', 'accepted'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions = [];

    // Search across customer, vehicle, and number fields
    if (q) {
      whereConditions.push(
        or(
          like(quotations.customer, `%${q}%`),
          like(quotations.vehicle, `%${q}%`),
          like(quotations.number, `%${q}%`)
        )
      );
    }

    // Filter by status
    if (status && VALID_STATUSES.includes(status as any)) {
      whereConditions.push(eq(quotations.status, status));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(quotations)
      .where(whereClause);
    
    const total = totalResult[0].count;

    // Get quotations with pagination
    const results = await db
      .select()
      .from(quotations)
      .where(whereClause)
      .orderBy(desc(quotations.createdAt))
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
    });

  } catch (error) {
    console.error('GET quotations error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, customer, vehicle, amount, status } = body;

    // Validate required fields
    if (!number || typeof number !== 'string' || number.trim() === '') {
      return NextResponse.json({ 
        error: "Number is required and must be a non-empty string",
        code: "MISSING_NUMBER" 
      }, { status: 400 });
    }

    if (!customer || typeof customer !== 'string' || customer.trim() === '') {
      return NextResponse.json({ 
        error: "Customer is required and must be a non-empty string",
        code: "MISSING_CUSTOMER" 
      }, { status: 400 });
    }

    if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
      return NextResponse.json({ 
        error: "Vehicle is required and must be a non-empty string",
        code: "MISSING_VEHICLE" 
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json({ 
        error: "Amount is required and must be a positive integer",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({ 
        error: `Status is required and must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Check if number is unique
    const existingQuotation = await db
      .select()
      .from(quotations)
      .where(eq(quotations.number, number.trim()))
      .limit(1);

    if (existingQuotation.length > 0) {
      return NextResponse.json({ 
        error: "Quotation number must be unique",
        code: "DUPLICATE_NUMBER" 
      }, { status: 400 });
    }

    // Create new quotation
    const newQuotation = await db
      .insert(quotations)
      .values({
        number: number.trim(),
        customer: customer.trim(),
        vehicle: vehicle.trim(),
        amount,
        status,
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json({ 
      data: newQuotation[0] 
    }, { status: 201 });

  } catch (error) {
    console.error('POST quotations error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}