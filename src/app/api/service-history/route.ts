import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { serviceHistory } from '@/db/schema';
import { eq, like, and, or, desc, gte, lte, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate date parameters
    if (from && isNaN(Date.parse(from))) {
      return NextResponse.json({ 
        error: "Invalid 'from' date format. Use ISO date format.",
        code: "INVALID_FROM_DATE" 
      }, { status: 400 });
    }

    if (to && isNaN(Date.parse(to))) {
      return NextResponse.json({ 
        error: "Invalid 'to' date format. Use ISO date format.",
        code: "INVALID_TO_DATE" 
      }, { status: 400 });
    }

    let whereConditions = [];

    // Search functionality
    if (search) {
      whereConditions.push(
        or(
          like(serviceHistory.customer, `%${search}%`),
          like(serviceHistory.vehicle, `%${search}%`),
          like(serviceHistory.jobNo, `%${search}%`)
        )
      );
    }

    // Date range filtering
    if (from) {
      whereConditions.push(gte(serviceHistory.date, from));
    }

    if (to) {
      whereConditions.push(lte(serviceHistory.date, to));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count for pagination
    const totalResult = await db.select({ count: count() })
      .from(serviceHistory)
      .where(whereClause);
    
    const total = totalResult[0].count;

    // Get paginated results
    let query = db.select()
      .from(serviceHistory)
      .orderBy(desc(serviceHistory.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query;

    // Calculate pagination metadata
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
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { customer, vehicle, jobNo, date, amount } = requestBody;

    // Input validation
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

    if (!jobNo || typeof jobNo !== 'string' || jobNo.trim() === '') {
      return NextResponse.json({ 
        error: "Job number is required and must be a non-empty string",
        code: "MISSING_JOB_NO" 
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return NextResponse.json({ 
        error: "Date is required and must be a valid ISO date string",
        code: "INVALID_DATE" 
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'string' || amount.trim() === '') {
      return NextResponse.json({ 
        error: "Amount is required and must be a non-empty string",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData = {
      customer: customer.trim(),
      vehicle: vehicle.trim(),
      jobNo: jobNo.trim(),
      date: date.trim(),
      amount: amount.trim(),
      createdAt: Date.now()
    };

    const newRecord = await db.insert(serviceHistory)
      .values(sanitizedData)
      .returning();

    return NextResponse.json({ 
      data: newRecord[0] 
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}