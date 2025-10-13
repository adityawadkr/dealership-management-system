import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { roles } from '@/db/schema';
import { eq, like, count, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const role = await db.select()
        .from(roles)
        .where(eq(roles.id, parseInt(id)))
        .limit(1);

      if (role.length === 0) {
        return NextResponse.json({ 
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({ data: role[0] });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q');

    let query = db.select().from(roles);
    let countQuery = db.select({ count: count() }).from(roles);

    if (search) {
      const searchCondition = like(roles.name, `%${search}%`);
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    const [results, totalCount] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    const total = totalCount[0].count;
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, permissionsJson } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    const trimmedName = name.trim();

    const existingRole = await db.select()
      .from(roles)
      .where(eq(roles.name, trimmedName))
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json({ 
        error: "Role with this name already exists",
        code: "DUPLICATE_ROLE_NAME" 
      }, { status: 400 });
    }

    const newRole = await db.insert(roles)
      .values({
        name: trimmedName,
        description: description || null,
        permissionsJson: permissionsJson || null,
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json({ data: newRole[0] }, { status: 201 });

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
    const { name, description, permissionsJson } = body;

    const existingRole = await db.select()
      .from(roles)
      .where(eq(roles.id, parseInt(id)))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json({ 
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND' 
      }, { status: 404 });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ 
          error: "Name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }

      const trimmedName = name.trim();
      
      const duplicateRole = await db.select()
        .from(roles)
        .where(
          and(
            eq(roles.name, trimmedName),
            eq(roles.id, parseInt(id))
          )
        )
        .limit(1);

      if (duplicateRole.length > 0 && duplicateRole[0].id !== parseInt(id)) {
        return NextResponse.json({ 
          error: "Role with this name already exists",
          code: "DUPLICATE_ROLE_NAME" 
        }, { status: 400 });
      }
    }

    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (permissionsJson !== undefined) {
      updateData.permissionsJson = permissionsJson;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ data: existingRole[0] });
    }

    const updatedRole = await db.update(roles)
      .set(updateData)
      .where(eq(roles.id, parseInt(id)))
      .returning();

    return NextResponse.json({ data: updatedRole[0] });

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

    const existingRole = await db.select()
      .from(roles)
      .where(eq(roles.id, parseInt(id)))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json({ 
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedRole = await db.delete(roles)
      .where(eq(roles.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Role deleted successfully',
      data: deletedRole[0] 
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}