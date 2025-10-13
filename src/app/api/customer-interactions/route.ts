import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customerInteractions, customers } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const interactionId = parseInt(id);
      if (isNaN(interactionId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const interaction = await db.select()
        .from(customerInteractions)
        .where(eq(customerInteractions.id, interactionId))
        .limit(1);

      if (interaction.length === 0) {
        return NextResponse.json({ 
          error: 'Interaction not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(interaction[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const customerId = searchParams.get('customer_id');
    const interactionType = searchParams.get('interaction_type');

    let whereConditions = [];

    if (customerId) {
      const customerIdInt = parseInt(customerId);
      if (!isNaN(customerIdInt)) {
        whereConditions.push(eq(customerInteractions.customerId, customerIdInt));
      }
    }

    if (interactionType) {
      whereConditions.push(eq(customerInteractions.interactionType, interactionType));
    }

    let query = db.select().from(customerInteractions);

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const interactions = await query
      .orderBy(desc(customerInteractions.createdAt))
      .limit(limit)
      .offset(offset);

    let countQuery = db.select({ count: count() }).from(customerInteractions);
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions));
    }
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      data: interactions,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + interactions.length < total
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

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { customerId, interactionType, notes, contactedBy } = body;

    if (!customerId) {
      return NextResponse.json({ 
        error: "customerId is required",
        code: "MISSING_CUSTOMER_ID" 
      }, { status: 400 });
    }

    if (!interactionType) {
      return NextResponse.json({ 
        error: "interactionType is required",
        code: "MISSING_INTERACTION_TYPE" 
      }, { status: 400 });
    }

    if (!contactedBy) {
      return NextResponse.json({ 
        error: "contactedBy is required",
        code: "MISSING_CONTACTED_BY" 
      }, { status: 400 });
    }

    const customerIdInt = parseInt(customerId);
    if (isNaN(customerIdInt)) {
      return NextResponse.json({ 
        error: "customerId must be a valid integer",
        code: "INVALID_CUSTOMER_ID" 
      }, { status: 400 });
    }

    const customerExists = await db.select()
      .from(customers)
      .where(eq(customers.id, customerIdInt))
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json({ 
        error: "Customer not found",
        code: "CUSTOMER_NOT_FOUND" 
      }, { status: 400 });
    }

    const newInteraction = await db.insert(customerInteractions)
      .values({
        customerId: customerIdInt,
        interactionType: interactionType.trim(),
        notes: notes ? notes.trim() : null,
        contactedBy: contactedBy.trim(),
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json(newInteraction[0], { status: 201 });

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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const interactionId = parseInt(id);

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existingInteraction = await db.select()
      .from(customerInteractions)
      .where(eq(customerInteractions.id, interactionId))
      .limit(1);

    if (existingInteraction.length === 0) {
      return NextResponse.json({ 
        error: 'Interaction not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const { interactionType, notes, contactedBy } = body;

    const updates: any = {};

    if (interactionType !== undefined) {
      updates.interactionType = interactionType.trim();
    }

    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }

    if (contactedBy !== undefined) {
      updates.contactedBy = contactedBy.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingInteraction[0], { status: 200 });
    }

    const updatedInteraction = await db.update(customerInteractions)
      .set(updates)
      .where(eq(customerInteractions.id, interactionId))
      .returning();

    return NextResponse.json(updatedInteraction[0], { status: 200 });

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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const interactionId = parseInt(id);

    const existingInteraction = await db.select()
      .from(customerInteractions)
      .where(eq(customerInteractions.id, interactionId))
      .limit(1);

    if (existingInteraction.length === 0) {
      return NextResponse.json({ 
        error: 'Interaction not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(customerInteractions)
      .where(eq(customerInteractions.id, interactionId))
      .returning();

    return NextResponse.json({ 
      message: 'Interaction deleted successfully',
      data: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}