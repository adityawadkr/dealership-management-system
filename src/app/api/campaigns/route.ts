import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq, like, and, count, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;

function validateStatus(status: string): boolean {
  return VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]);
}

function validateDateFormat(dateString: string): boolean {
  if (!dateString) return true;
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
  return isoDateRegex.test(dateString);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const campaign = await db.select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(id)))
        .limit(1);

      if (campaign.length === 0) {
        return NextResponse.json({ 
          error: 'Campaign not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(campaign[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q');
    const statusFilter = searchParams.get('status');
    const targetSegmentFilter = searchParams.get('target_segment');

    const conditions = [];

    if (search) {
      conditions.push(like(campaigns.name, `%${search}%`));
    }

    if (statusFilter) {
      if (!validateStatus(statusFilter)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(campaigns.status, statusFilter));
    }

    if (targetSegmentFilter) {
      conditions.push(eq(campaigns.targetSegment, targetSegmentFilter));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [campaignsData, totalCountResult] = await Promise.all([
      db.select()
        .from(campaigns)
        .where(whereCondition)
        .orderBy(desc(campaigns.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(campaigns)
        .where(whereCondition)
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return NextResponse.json({
      data: campaignsData,
      meta: {
        total: totalCount,
        limit,
        offset,
        page: currentPage,
        totalPages
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET campaigns error:', error);
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

    const { name, description, targetSegment, startDate, endDate, status } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    const campaignStatus = status || 'draft';
    if (!validateStatus(campaignStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    if (startDate && !validateDateFormat(startDate)) {
      return NextResponse.json({ 
        error: "Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
        code: 'INVALID_START_DATE' 
      }, { status: 400 });
    }

    if (endDate && !validateDateFormat(endDate)) {
      return NextResponse.json({ 
        error: "Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
        code: 'INVALID_END_DATE' 
      }, { status: 400 });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return NextResponse.json({ 
          error: "End date cannot be before start date",
          code: 'INVALID_DATE_RANGE' 
        }, { status: 400 });
      }
    }

    const newCampaign = await db.insert(campaigns)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        targetSegment: targetSegment?.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        status: campaignStatus,
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json(newCampaign[0], { status: 201 });

  } catch (error) {
    console.error('POST campaigns error:', error);
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

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Campaign not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const { name, description, targetSegment, startDate, endDate, status } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ 
        error: "Name must be a non-empty string",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    if (status !== undefined && !validateStatus(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    if (startDate !== undefined && startDate !== null && !validateDateFormat(startDate)) {
      return NextResponse.json({ 
        error: "Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
        code: 'INVALID_START_DATE' 
      }, { status: 400 });
    }

    if (endDate !== undefined && endDate !== null && !validateDateFormat(endDate)) {
      return NextResponse.json({ 
        error: "Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
        code: 'INVALID_END_DATE' 
      }, { status: 400 });
    }

    const finalStartDate = startDate !== undefined ? startDate : existing[0].startDate;
    const finalEndDate = endDate !== undefined ? endDate : existing[0].endDate;

    if (finalStartDate && finalEndDate) {
      const start = new Date(finalStartDate);
      const end = new Date(finalEndDate);
      if (end < start) {
        return NextResponse.json({ 
          error: "End date cannot be before start date",
          code: 'INVALID_DATE_RANGE' 
        }, { status: 400 });
      }
    }

    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (targetSegment !== undefined) updates.targetSegment = targetSegment?.trim() || null;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (status !== undefined) updates.status = status;

    const updated = await db.update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Campaign not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT campaigns error:', error);
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

    const existing = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Campaign not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Campaign not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Campaign deleted successfully',
      data: deleted[0] 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE campaigns error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}