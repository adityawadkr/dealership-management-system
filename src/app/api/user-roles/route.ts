import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userRoles, user, roles } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(userRoles)
        .where(eq(userRoles.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'User role assignment not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('user_id');
    const roleId = searchParams.get('role_id');

    // Build query with filters
    let whereConditions = [];
    
    if (userId) {
      whereConditions.push(eq(userRoles.userId, userId));
    }
    
    if (roleId) {
      if (isNaN(parseInt(roleId))) {
        return NextResponse.json({ 
          error: "Valid role ID is required",
          code: "INVALID_ROLE_ID" 
        }, { status: 400 });
      }
      whereConditions.push(eq(userRoles.roleId, parseInt(roleId)));
    }

    // Get total count for pagination meta
    let countQuery = db.select({ count: count() }).from(userRoles);
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions));
    }
    const totalCountResult = await countQuery;
    const totalCount = totalCountResult[0].count;

    // Get paginated results
    let query = db.select().from(userRoles);
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, roleId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!roleId) {
      return NextResponse.json({ 
        error: "roleId is required",
        code: "MISSING_ROLE_ID" 
      }, { status: 400 });
    }

    // Validate roleId is valid integer
    if (isNaN(parseInt(roleId.toString()))) {
      return NextResponse.json({ 
        error: "roleId must be a valid integer",
        code: "INVALID_ROLE_ID" 
      }, { status: 400 });
    }

    // Validate userId exists in user table
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate roleId exists in roles table
    const roleExists = await db.select()
      .from(roles)
      .where(eq(roles.id, parseInt(roleId.toString())))
      .limit(1);

    if (roleExists.length === 0) {
      return NextResponse.json({ 
        error: "Role not found",
        code: "ROLE_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check if assignment already exists
    const existingAssignment = await db.select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, parseInt(roleId.toString()))
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return NextResponse.json({ 
        error: "User already has this role assigned",
        code: "DUPLICATE_ASSIGNMENT" 
      }, { status: 400 });
    }

    // Create new role assignment
    const newAssignment = await db.insert(userRoles)
      .values({
        userId: userId,
        roleId: parseInt(roleId.toString()),
        assignedAt: Date.now()
      })
      .returning();

    return NextResponse.json(newAssignment[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID is provided and is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(userRoles)
      .where(eq(userRoles.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User role assignment not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(userRoles)
      .where(eq(userRoles.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'User role assignment deleted successfully',
      data: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}