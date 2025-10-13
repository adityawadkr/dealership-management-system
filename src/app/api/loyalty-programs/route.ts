import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loyaltyPrograms, customers } from '@/db/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const program = await db.select()
        .from(loyaltyPrograms)
        .where(eq(loyaltyPrograms.id, parseInt(id)))
        .limit(1);

      if (program.length === 0) {
        return NextResponse.json({ 
          error: 'Loyalty program not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(program[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const tier = searchParams.get('tier');
    const customerId = searchParams.get('customer_id');
    const sortField = searchParams.get('sort') || 'id';
    const sortOrder = searchParams.get('order') || 'desc';

    // Build conditions
    const conditions = [];

    if (tier) {
      if (!VALID_TIERS.includes(tier)) {
        return NextResponse.json({ 
          error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
          code: 'INVALID_TIER' 
        }, { status: 400 });
      }
      conditions.push(eq(loyaltyPrograms.tier, tier));
    }

    if (customerId) {
      if (isNaN(parseInt(customerId))) {
        return NextResponse.json({ 
          error: 'Valid customer ID is required',
          code: 'INVALID_CUSTOMER_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(loyaltyPrograms.customerId, parseInt(customerId)));
    }

    // Build query
    let query = db.select().from(loyaltyPrograms);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortField === 'points' ? loyaltyPrograms.points :
                       sortField === 'joinedAt' ? loyaltyPrograms.joinedAt :
                       sortField === 'updatedAt' ? loyaltyPrograms.updatedAt :
                       loyaltyPrograms.id;

    query = sortOrder === 'asc' 
      ? query.orderBy(asc(sortColumn))
      : query.orderBy(desc(sortColumn));

    // Get total count
    let countQuery = db.select({ count: count() }).from(loyaltyPrograms);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalResult = await countQuery;
    const total = totalResult[0].count;

    // Get paginated results
    const programs = await query.limit(limit).offset(offset);

    return NextResponse.json({
      data: programs,
      meta: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { customerId, points, tier } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json({ 
        error: "Customer ID is required",
        code: "MISSING_CUSTOMER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(customerId))) {
      return NextResponse.json({ 
        error: "Valid customer ID is required",
        code: "INVALID_CUSTOMER_ID" 
      }, { status: 400 });
    }

    // Validate tier if provided
    if (tier && !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ 
        error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
        code: 'INVALID_TIER' 
      }, { status: 400 });
    }

    // Check if customer exists
    const customerExists = await db.select()
      .from(customers)
      .where(eq(customers.id, parseInt(customerId)))
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json({ 
        error: "Customer not found",
        code: "CUSTOMER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check if customer already has a loyalty program (one-to-one relationship)
    const existingProgram = await db.select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.customerId, parseInt(customerId)))
      .limit(1);

    if (existingProgram.length > 0) {
      return NextResponse.json({ 
        error: "Customer already has a loyalty program",
        code: "DUPLICATE_CUSTOMER" 
      }, { status: 400 });
    }

    // Create loyalty program
    const now = Date.now();
    const newProgram = await db.insert(loyaltyPrograms)
      .values({
        customerId: parseInt(customerId),
        points: points !== undefined ? parseInt(points) : 0,
        tier: tier || 'silver',
        joinedAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newProgram[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { points, tier } = body;

    // Check if program exists
    const existingProgram = await db.select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, parseInt(id)))
      .limit(1);

    if (existingProgram.length === 0) {
      return NextResponse.json({ 
        error: 'Loyalty program not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate tier if provided
    if (tier && !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ 
        error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
        code: 'INVALID_TIER' 
      }, { status: 400 });
    }

    // Build update object
    const updates: any = {
      updatedAt: Date.now()
    };

    if (points !== undefined) {
      updates.points = parseInt(points);
    }

    if (tier !== undefined) {
      updates.tier = tier;
    }

    // Update loyalty program
    const updatedProgram = await db.update(loyaltyPrograms)
      .set(updates)
      .where(eq(loyaltyPrograms.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProgram[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if program exists
    const existingProgram = await db.select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, parseInt(id)))
      .limit(1);

    if (existingProgram.length === 0) {
      return NextResponse.json({ 
        error: 'Loyalty program not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete loyalty program
    const deletedProgram = await db.delete(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Loyalty program deleted successfully',
      data: deletedProgram[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}