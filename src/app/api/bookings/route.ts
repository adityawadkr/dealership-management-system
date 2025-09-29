import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';

const VALID_STATUSES = ['booked', 'cancelled', 'delivered'];

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Build where conditions
    const conditions = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        }, { status: 400 });
      }
      conditions.push(eq(bookings.status, status));
    }

    if (fromDate) {
      if (!isValidISODate(fromDate)) {
        return NextResponse.json({
          error: 'Invalid from date. Must be in ISO date format (YYYY-MM-DD)',
          code: 'INVALID_FROM_DATE'
        }, { status: 400 });
      }
      conditions.push(gte(bookings.date, fromDate));
    }

    if (toDate) {
      if (!isValidISODate(toDate)) {
        return NextResponse.json({
          error: 'Invalid to date. Must be in ISO date format (YYYY-MM-DD)',
          code: 'INVALID_TO_DATE'
        }, { status: 400 });
      }
      conditions.push(lte(bookings.date, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(bookings)
      .where(whereClause);
    const total = totalResult[0].count;

    // Get paginated results
    let query = db.select().from(bookings);
    
    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(bookings.createdAt);

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
    console.error('GET bookings error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, vehicle, quotationNo, date, status } = body;

    // Validation
    if (!customer || typeof customer !== 'string' || customer.trim() === '') {
      return NextResponse.json({
        error: 'Customer is required and must be a non-empty string',
        code: 'MISSING_CUSTOMER'
      }, { status: 400 });
    }

    if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
      return NextResponse.json({
        error: 'Vehicle is required and must be a non-empty string',
        code: 'MISSING_VEHICLE'
      }, { status: 400 });
    }

    if (!quotationNo || typeof quotationNo !== 'string' || quotationNo.trim() === '') {
      return NextResponse.json({
        error: 'QuotationNo is required and must be a non-empty string',
        code: 'MISSING_QUOTATION_NO'
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({
        error: 'Date is required and must be a valid ISO date string',
        code: 'MISSING_DATE'
      }, { status: 400 });
    }

    if (!isValidISODate(date)) {
      return NextResponse.json({
        error: 'Date must be a valid ISO date string (YYYY-MM-DD)',
        code: 'INVALID_DATE'
      }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `Status is required and must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Create new booking
    const newBooking = await db.insert(bookings)
      .values({
        customer: customer.trim(),
        vehicle: vehicle.trim(),
        quotationNo: quotationNo.trim(),
        date,
        status,
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json({
      data: newBooking[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST bookings error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}