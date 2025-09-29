import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { eq, like, and, or, desc, count } from 'drizzle-orm';

const VALID_STATUSES = ['new', 'contacted', 'qualified'] as const;

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(Math.max(1, parseInt(searchParams.get('pageSize') || '50')), 100);
    const offset = (page - 1) * pageSize;

    let query = db.select().from(leads);
    let countQuery = db.select({ count: count() }).from(leads);

    if (q) {
      const searchCondition = or(
        like(leads.name, `%${q}%`),
        like(leads.phone, `%${q}%`),
        like(leads.email, `%${q}%`)
      );
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    const [results, totalResult] = await Promise.all([
      query.orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset),
      countQuery
    ]);

    const total = totalResult[0].count;
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
    console.error('GET leads error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { name, phone, email, source, status } = requestBody;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be non-empty",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return NextResponse.json({ 
        error: "Phone is required and must be non-empty",
        code: "MISSING_PHONE" 
      }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: "Email is required and must be non-empty",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!validateEmail(email.trim())) {
      return NextResponse.json({ 
        error: "Email must be in valid format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    if (!source || typeof source !== 'string' || source.trim() === '') {
      return NextResponse.json({ 
        error: "Source is required and must be non-empty",
        code: "MISSING_SOURCE" 
      }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    const insertData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      source: source.trim(),
      status,
      createdAt: Date.now()
    };

    const newLead = await db.insert(leads)
      .values(insertData)
      .returning();

    return NextResponse.json({ 
      data: newLead[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('POST leads error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}