import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employees, user } from '@/db/schema';
import { eq, like, or, and, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['active', 'inactive', 'terminated'];

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single employee fetch by ID
    if (id) {
      const employeeId = parseInt(id);
      if (isNaN(employeeId)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const employee = await db.select()
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (employee.length === 0) {
        return NextResponse.json({ 
          error: 'Employee not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(employee[0]);
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q') || searchParams.get('search');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(employees.name, `%${search}%`),
          like(employees.employeeCode, `%${search}%`)
        )
      );
    }

    if (department) {
      conditions.push(eq(employees.department, department));
    }

    if (status) {
      conditions.push(eq(employees.status, status));
    }

    if (branch) {
      conditions.push(eq(employees.branch, branch));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCountResult = await db.select({ count: count() })
      .from(employees)
      .where(whereClause);
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated results
    let query = db.select().from(employees);
    
    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(order === 'asc' ? employees[sort as keyof typeof employees] : employees[sort as keyof typeof employees]);

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
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
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
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

    const { 
      employeeCode, 
      name, 
      designation, 
      department, 
      dateOfJoining, 
      salary,
      branch,
      status = 'active'
    } = body;

    // Validate required fields
    if (!employeeCode || !employeeCode.trim()) {
      return NextResponse.json({ 
        error: 'Employee code is required',
        code: 'MISSING_EMPLOYEE_CODE' 
      }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    if (!designation || !designation.trim()) {
      return NextResponse.json({ 
        error: 'Designation is required',
        code: 'MISSING_DESIGNATION' 
      }, { status: 400 });
    }

    if (!department || !department.trim()) {
      return NextResponse.json({ 
        error: 'Department is required',
        code: 'MISSING_DEPARTMENT' 
      }, { status: 400 });
    }

    if (!dateOfJoining || !dateOfJoining.trim()) {
      return NextResponse.json({ 
        error: 'Date of joining is required',
        code: 'MISSING_DATE_OF_JOINING' 
      }, { status: 400 });
    }

    if (salary === undefined || salary === null) {
      return NextResponse.json({ 
        error: 'Salary is required',
        code: 'MISSING_SALARY' 
      }, { status: 400 });
    }

    // Validate salary is non-negative
    if (salary < 0) {
      return NextResponse.json({ 
        error: 'Salary must be non-negative',
        code: 'INVALID_SALARY' 
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check if employee code already exists
    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.employeeCode, employeeCode.trim()))
      .limit(1);

    if (existingEmployee.length > 0) {
      return NextResponse.json({ 
        error: 'Employee code already exists',
        code: 'DUPLICATE_EMPLOYEE_CODE' 
      }, { status: 400 });
    }

    // Validate userId if provided
    if (body.userId) {
      const userExists = await db.select()
        .from(user)
        .where(eq(user.id, body.userId))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json({ 
          error: 'Referenced user does not exist',
          code: 'INVALID_USER_ID' 
        }, { status: 400 });
      }
    }

    const now = Date.now();

    // Create new employee
    const newEmployee = await db.insert(employees)
      .values({
        employeeCode: employeeCode.trim(),
        name: name.trim(),
        designation: designation.trim(),
        department: department.trim(),
        branch: branch?.trim() || null,
        dateOfJoining: dateOfJoining.trim(),
        salary: parseInt(salary),
        status: status,
        userId: body.userId || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newEmployee[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const employeeId = parseInt(id);
    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if employee exists
    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json({ 
        error: 'Employee not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {};

    // Validate and prepare updates
    if (body.employeeCode !== undefined) {
      const trimmedCode = body.employeeCode.trim();
      if (!trimmedCode) {
        return NextResponse.json({ 
          error: 'Employee code cannot be empty',
          code: 'INVALID_EMPLOYEE_CODE' 
        }, { status: 400 });
      }

      // Check uniqueness if changing employee code
      if (trimmedCode !== existingEmployee[0].employeeCode) {
        const duplicateCheck = await db.select()
          .from(employees)
          .where(eq(employees.employeeCode, trimmedCode))
          .limit(1);

        if (duplicateCheck.length > 0) {
          return NextResponse.json({ 
            error: 'Employee code already exists',
            code: 'DUPLICATE_EMPLOYEE_CODE' 
          }, { status: 400 });
        }
      }

      updates.employeeCode = trimmedCode;
    }

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json({ 
          error: 'Name cannot be empty',
          code: 'INVALID_NAME' 
        }, { status: 400 });
      }
      updates.name = trimmedName;
    }

    if (body.designation !== undefined) {
      const trimmedDesignation = body.designation.trim();
      if (!trimmedDesignation) {
        return NextResponse.json({ 
          error: 'Designation cannot be empty',
          code: 'INVALID_DESIGNATION' 
        }, { status: 400 });
      }
      updates.designation = trimmedDesignation;
    }

    if (body.department !== undefined) {
      const trimmedDepartment = body.department.trim();
      if (!trimmedDepartment) {
        return NextResponse.json({ 
          error: 'Department cannot be empty',
          code: 'INVALID_DEPARTMENT' 
        }, { status: 400 });
      }
      updates.department = trimmedDepartment;
    }

    if (body.branch !== undefined) {
      updates.branch = body.branch ? body.branch.trim() : null;
    }

    if (body.dateOfJoining !== undefined) {
      const trimmedDate = body.dateOfJoining.trim();
      if (!trimmedDate) {
        return NextResponse.json({ 
          error: 'Date of joining cannot be empty',
          code: 'INVALID_DATE_OF_JOINING' 
        }, { status: 400 });
      }
      updates.dateOfJoining = trimmedDate;
    }

    if (body.salary !== undefined) {
      const salaryValue = parseInt(body.salary);
      if (isNaN(salaryValue) || salaryValue < 0) {
        return NextResponse.json({ 
          error: 'Salary must be a non-negative number',
          code: 'INVALID_SALARY' 
        }, { status: 400 });
      }
      updates.salary = salaryValue;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = body.status;
    }

    // Always update updatedAt
    updates.updatedAt = Date.now();

    // Perform update
    const updatedEmployee = await db.update(employees)
      .set(updates)
      .where(eq(employees.id, employeeId))
      .returning();

    return NextResponse.json(updatedEmployee[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const employeeId = parseInt(id);

    // Check if employee exists
    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json({ 
        error: 'Employee not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete employee
    const deletedEmployee = await db.delete(employees)
      .where(eq(employees.id, employeeId))
      .returning();

    return NextResponse.json({
      message: 'Employee deleted successfully',
      employee: deletedEmployee[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}