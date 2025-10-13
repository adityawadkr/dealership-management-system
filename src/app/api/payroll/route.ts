import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payroll, employees } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'processed', 'paid'];

function validatePayrollData(data: any, isUpdate = false) {
  const errors: string[] = [];

  if (!isUpdate) {
    if (!data.employeeId) errors.push('employeeId is required');
    if (!data.month) errors.push('month is required');
    if (!data.year) errors.push('year is required');
    if (data.basicSalary === undefined || data.basicSalary === null) errors.push('basicSalary is required');
    if (data.allowances === undefined || data.allowances === null) errors.push('allowances is required');
    if (data.deductions === undefined || data.deductions === null) errors.push('deductions is required');
  }

  if (data.month !== undefined) {
    const month = parseInt(data.month);
    if (isNaN(month) || month < 1 || month > 12) {
      errors.push('month must be between 1 and 12');
    }
  }

  if (data.year !== undefined) {
    const year = parseInt(data.year);
    if (isNaN(year) || year < 2020) {
      errors.push('year must be 2020 or later');
    }
  }

  if (data.basicSalary !== undefined && data.basicSalary < 0) {
    errors.push('basicSalary cannot be negative');
  }

  if (data.allowances !== undefined && data.allowances < 0) {
    errors.push('allowances cannot be negative');
  }

  if (data.deductions !== undefined && data.deductions < 0) {
    errors.push('deductions cannot be negative');
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return errors;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const payrollId = parseInt(id);
      if (isNaN(payrollId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(payroll)
        .where(eq(payroll.id, payrollId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Payroll record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const employeeId = searchParams.get('employee_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    let conditions = [];

    if (employeeId) {
      const empId = parseInt(employeeId);
      if (!isNaN(empId)) {
        conditions.push(eq(payroll.employeeId, empId));
      }
    }

    if (month) {
      const monthNum = parseInt(month);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        conditions.push(eq(payroll.month, monthNum));
      }
    }

    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        conditions.push(eq(payroll.year, yearNum));
      }
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(payroll.status, status));
    }

    let query = db.select().from(payroll);
    let countQuery = db.select({ count: count() }).from(payroll);

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const [records, totalCount] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    const total = totalCount[0]?.count || 0;

    return NextResponse.json({
      data: records,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
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

    const validationErrors = validatePayrollData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const employeeExists = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(body.employeeId)))
      .limit(1);

    if (employeeExists.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' },
        { status: 400 }
      );
    }

    const basicSalary = parseInt(body.basicSalary);
    const allowances = parseInt(body.allowances);
    const deductions = parseInt(body.deductions);
    const netSalary = basicSalary + allowances - deductions;

    const newPayroll = await db
      .insert(payroll)
      .values({
        employeeId: parseInt(body.employeeId),
        month: parseInt(body.month),
        year: parseInt(body.year),
        basicSalary,
        allowances,
        deductions,
        netSalary,
        status: body.status || 'pending',
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json(newPayroll[0], { status: 201 });
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const payrollId = parseInt(id);
    const body = await request.json();

    const validationErrors = validatePayrollData(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(payroll)
      .where(eq(payroll.id, payrollId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payroll record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentRecord = existing[0];
    const updates: any = {};

    if (body.basicSalary !== undefined) updates.basicSalary = parseInt(body.basicSalary);
    if (body.allowances !== undefined) updates.allowances = parseInt(body.allowances);
    if (body.deductions !== undefined) updates.deductions = parseInt(body.deductions);
    if (body.status !== undefined) updates.status = body.status;

    if (updates.basicSalary !== undefined || updates.allowances !== undefined || updates.deductions !== undefined) {
      const basicSalary = updates.basicSalary !== undefined ? updates.basicSalary : currentRecord.basicSalary;
      const allowances = updates.allowances !== undefined ? updates.allowances : currentRecord.allowances;
      const deductions = updates.deductions !== undefined ? updates.deductions : currentRecord.deductions;
      updates.netSalary = basicSalary + allowances - deductions;
    }

    const updated = await db
      .update(payroll)
      .set(updates)
      .where(eq(payroll.id, payrollId))
      .returning();

    return NextResponse.json(updated[0]);
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const payrollId = parseInt(id);

    const existing = await db
      .select()
      .from(payroll)
      .where(eq(payroll.id, payrollId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payroll record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(payroll)
      .where(eq(payroll.id, payrollId))
      .returning();

    return NextResponse.json({
      message: 'Payroll record deleted successfully',
      data: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}