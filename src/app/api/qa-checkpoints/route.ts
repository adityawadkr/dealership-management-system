import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { qaCheckpoints } from '@/db/schema';
import { eq, and, asc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const checkpoint = await db
        .select()
        .from(qaCheckpoints)
        .where(eq(qaCheckpoints.id, parseInt(id)))
        .limit(1);

      if (checkpoint.length === 0) {
        return NextResponse.json(
          { error: 'QA checkpoint not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(checkpoint[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const module = searchParams.get('module');
    const isMandatoryParam = searchParams.get('is_mandatory');

    // Build where conditions
    const conditions = [];
    if (module) {
      conditions.push(eq(qaCheckpoints.module, module));
    }
    if (isMandatoryParam !== null) {
      const isMandatory = isMandatoryParam === 'true' ? 1 : 0;
      conditions.push(eq(qaCheckpoints.isMandatory, isMandatory));
    }

    // Build query with filters
    let query = db.select().from(qaCheckpoints);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count for pagination meta
    let countQuery = db.select({ count: count() }).from(qaCheckpoints);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalCountResult = await countQuery;
    const totalCount = totalCountResult[0].count;

    // Execute query with sorting and pagination
    const results = await query
      .orderBy(asc(qaCheckpoints.displayOrder))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        data: results,
        meta: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + results.length < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, checkpointName, description, isMandatory, displayOrder } = body;

    // Validate required fields
    if (!module) {
      return NextResponse.json(
        { error: 'Module is required', code: 'MISSING_MODULE' },
        { status: 400 }
      );
    }

    if (!checkpointName) {
      return NextResponse.json(
        { error: 'Checkpoint name is required', code: 'MISSING_CHECKPOINT_NAME' },
        { status: 400 }
      );
    }

    if (displayOrder === undefined || displayOrder === null) {
      return NextResponse.json(
        { error: 'Display order is required', code: 'MISSING_DISPLAY_ORDER' },
        { status: 400 }
      );
    }

    // Validate displayOrder
    const displayOrderNum = parseInt(displayOrder);
    if (isNaN(displayOrderNum) || displayOrderNum < 0) {
      return NextResponse.json(
        { error: 'Display order must be a non-negative number', code: 'INVALID_DISPLAY_ORDER' },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults
    const insertData = {
      module: module.trim(),
      checkpointName: checkpointName.trim(),
      description: description ? description.trim() : null,
      isMandatory: isMandatory !== undefined ? (isMandatory ? 1 : 0) : 1,
      displayOrder: displayOrderNum,
      createdAt: Date.now(),
    };

    const newCheckpoint = await db
      .insert(qaCheckpoints)
      .values(insertData)
      .returning();

    return NextResponse.json(newCheckpoint[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if checkpoint exists
    const existing = await db
      .select()
      .from(qaCheckpoints)
      .where(eq(qaCheckpoints.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'QA checkpoint not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { module, checkpointName, description, isMandatory, displayOrder } = body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {};

    if (module !== undefined) {
      updates.module = module.trim();
    }

    if (checkpointName !== undefined) {
      updates.checkpointName = checkpointName.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (isMandatory !== undefined) {
      updates.isMandatory = isMandatory ? 1 : 0;
    }

    if (displayOrder !== undefined) {
      const displayOrderNum = parseInt(displayOrder);
      if (isNaN(displayOrderNum) || displayOrderNum < 0) {
        return NextResponse.json(
          { error: 'Display order must be a non-negative number', code: 'INVALID_DISPLAY_ORDER' },
          { status: 400 }
        );
      }
      updates.displayOrder = displayOrderNum;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(qaCheckpoints)
      .set(updates)
      .where(eq(qaCheckpoints.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if checkpoint exists
    const existing = await db
      .select()
      .from(qaCheckpoints)
      .where(eq(qaCheckpoints.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'QA checkpoint not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(qaCheckpoints)
      .where(eq(qaCheckpoints.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'QA checkpoint deleted successfully',
        checkpoint: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}