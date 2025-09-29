import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';

const VALID_STATUSES = ['scheduled', 'in_progress', 'completed'];

function isValidISODateTime(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let whereConditions = [];

    // Status filter
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        }, { status: 400 });
      }
      whereConditions.push(eq(appointments.status, status));
    }

    // Date range filters
    if (from) {
      if (!isValidISODateTime(from)) {
        return NextResponse.json({
          error: 'Invalid from date. Must be a valid ISO datetime string',
          code: 'INVALID_FROM_DATE'
        }, { status: 400 });
      }
      whereConditions.push(gte(appointments.date, from));
    }

    if (to) {
      if (!isValidISODateTime(to)) {
        return NextResponse.json({
          error: 'Invalid to date. Must be a valid ISO datetime string',
          code: 'INVALID_TO_DATE'
        }, { status: 400 });
      }
      whereConditions.push(lte(appointments.date, to));
    }

    // Build query
    let query = db.select().from(appointments);
    let countQuery = db.select({ count: count() }).from(appointments);

    if (whereConditions.length > 0) {
      const whereClause = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    // Execute queries
    const [results, totalResults] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    const total = totalResults[0].count;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: results,
      meta: {
        total,
        page,
        pageSize: limit,
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
    const body = await request.json();
    const { customer, vehicle, date, serviceType, status } = body;

    // Validation
    if (!customer || typeof customer !== 'string' || customer.trim() === '') {
      return NextResponse.json({
        error: 'Customer is required and must be a non-empty string',
        code: 'INVALID_CUSTOMER'
      }, { status: 400 });
    }

    if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
      return NextResponse.json({
        error: 'Vehicle is required and must be a non-empty string',
        code: 'INVALID_VEHICLE'
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string' || !isValidISODateTime(date)) {
      return NextResponse.json({
        error: 'Date is required and must be a valid ISO datetime string',
        code: 'INVALID_DATE'
      }, { status: 400 });
    }

    if (!serviceType || typeof serviceType !== 'string' || serviceType.trim() === '') {
      return NextResponse.json({
        error: 'Service type is required and must be a non-empty string',
        code: 'INVALID_SERVICE_TYPE'
      }, { status: 400 });
    }

    if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `Status is required and must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Create appointment
    const newAppointment = await db.insert(appointments).values({
      customer: customer.trim(),
      vehicle: vehicle.trim(),
      date,
      serviceType: serviceType.trim(),
      status,
      createdAt: Date.now()
    }).returning();

    return NextResponse.json({
      data: newAppointment[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}