import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const log = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, parseInt(id)))
        .limit(1);

      if (log.length === 0) {
        return NextResponse.json(
          { error: 'Audit log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(log[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const module = searchParams.get('module');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build filter conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (module) {
      conditions.push(eq(auditLogs.module, module));
    }

    if (from) {
      const fromDate = new Date(from).getTime();
      if (!isNaN(fromDate)) {
        conditions.push(gte(auditLogs.createdAt, fromDate));
      }
    }

    if (to) {
      const toDate = new Date(to).getTime();
      if (!isNaN(toDate)) {
        conditions.push(lte(auditLogs.createdAt, toDate));
      }
    }

    // Build query with filters
    let query = db.select().from(auditLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count for pagination meta
    let countQuery = db.select({ count: count() }).from(auditLogs);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    // Execute main query with pagination and sorting
    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        data: logs,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
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
    const { userId, action, module, recordId, recordType, changesJson, ipAddress } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required', code: 'MISSING_ACTION' },
        { status: 400 }
      );
    }

    if (!module) {
      return NextResponse.json(
        { error: 'Module is required', code: 'MISSING_MODULE' },
        { status: 400 }
      );
    }

    // Validate action is a valid string
    if (typeof action !== 'string' || action.trim().length === 0) {
      return NextResponse.json(
        { error: 'Action must be a non-empty string', code: 'INVALID_ACTION' },
        { status: 400 }
      );
    }

    // Validate module is a valid string
    if (typeof module !== 'string' || module.trim().length === 0) {
      return NextResponse.json(
        { error: 'Module must be a non-empty string', code: 'INVALID_MODULE' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (userId !== undefined && userId !== null && typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID must be a string', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (recordId !== undefined && recordId !== null && typeof recordId !== 'number') {
      return NextResponse.json(
        { error: 'Record ID must be a number', code: 'INVALID_RECORD_ID' },
        { status: 400 }
      );
    }

    if (recordType !== undefined && recordType !== null && typeof recordType !== 'string') {
      return NextResponse.json(
        { error: 'Record type must be a string', code: 'INVALID_RECORD_TYPE' },
        { status: 400 }
      );
    }

    if (changesJson !== undefined && changesJson !== null && typeof changesJson !== 'string') {
      return NextResponse.json(
        { error: 'Changes must be a JSON string', code: 'INVALID_CHANGES_JSON' },
        { status: 400 }
      );
    }

    if (ipAddress !== undefined && ipAddress !== null && typeof ipAddress !== 'string') {
      return NextResponse.json(
        { error: 'IP address must be a string', code: 'INVALID_IP_ADDRESS' },
        { status: 400 }
      );
    }

    // Prepare audit log data
    const auditLogData: any = {
      action: action.trim(),
      module: module.trim(),
      createdAt: Date.now(),
    };

    // Add optional fields if provided
    if (userId !== undefined && userId !== null) {
      auditLogData.userId = userId;
    }

    if (recordId !== undefined && recordId !== null) {
      auditLogData.recordId = recordId;
    }

    if (recordType !== undefined && recordType !== null) {
      auditLogData.recordType = recordType.trim();
    }

    if (changesJson !== undefined && changesJson !== null) {
      // Validate JSON string if provided
      try {
        if (changesJson.trim().length > 0) {
          JSON.parse(changesJson);
          auditLogData.changesJson = changesJson;
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Changes must be valid JSON', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
    }

    if (ipAddress !== undefined && ipAddress !== null) {
      auditLogData.ipAddress = ipAddress.trim();
    }

    // Insert audit log
    const newLog = await db
      .insert(auditLogs)
      .values(auditLogData)
      .returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed. Audit logs are immutable and cannot be updated.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed. Audit logs are immutable and cannot be deleted.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}