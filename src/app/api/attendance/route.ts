import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, employees } from '@/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';

const VALID_STATUSES = ['present', 'absent', 'leave', 'half-day'];

function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
  return timeRegex.test(time);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const attendanceId = parseInt(id);
      if (isNaN(attendanceId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(attendance)
        .where(eq(attendance.id, attendanceId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Attendance record not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const employeeId = searchParams.get('employee_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    let whereConditions = [];

    if (employeeId) {
      const empId = parseInt(employeeId);
      if (isNaN(empId)) {
        return NextResponse.json({ 
          error: "Valid employee_id is required",
          code: "INVALID_EMPLOYEE_ID" 
        }, { status: 400 });
      }
      whereConditions.push(eq(attendance.employeeId, empId));
    }

    if (date) {
      if (!validateDateFormat(date)) {
        return NextResponse.json({ 
          error: "Invalid date format. Use YYYY-MM-DD",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }
      whereConditions.push(eq(attendance.date, date));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      whereConditions.push(eq(attendance.status, status));
    }

    if (fromDate) {
      if (!validateDateFormat(fromDate)) {
        return NextResponse.json({ 
          error: "Invalid from date format. Use YYYY-MM-DD",
          code: "INVALID_FROM_DATE" 
        }, { status: 400 });
      }
      whereConditions.push(gte(attendance.date, fromDate));
    }

    if (toDate) {
      if (!validateDateFormat(toDate)) {
        return NextResponse.json({ 
          error: "Invalid to date format. Use YYYY-MM-DD",
          code: "INVALID_TO_DATE" 
        }, { status: 400 });
      }
      whereConditions.push(lte(attendance.date, toDate));
    }

    let query = db.select().from(attendance);
    let countQuery = db.select({ count: count() }).from(attendance);

    if (whereConditions.length > 0) {
      const whereClause = whereConditions.length === 1 
        ? whereConditions[0] 
        : and(...whereConditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const [results, totalCount] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount[0].count,
        limit,
        offset,
        hasMore: offset + limit < totalCount[0].count
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
    const body = await request.json();
    const { employeeId, date, status, checkIn, checkOut, notes } = body;

    if (!employeeId) {
      return NextResponse.json({ 
        error: "employeeId is required",
        code: "MISSING_EMPLOYEE_ID" 
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ 
        error: "date is required",
        code: "MISSING_DATE" 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: "status is required",
        code: "MISSING_STATUS" 
      }, { status: 400 });
    }

    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return NextResponse.json({ 
        error: "Invalid employeeId. Must be a valid integer",
        code: "INVALID_EMPLOYEE_ID" 
      }, { status: 400 });
    }

    const employeeExists = await db.select()
      .from(employees)
      .where(eq(employees.id, empId))
      .limit(1);

    if (employeeExists.length === 0) {
      return NextResponse.json({ 
        error: "Employee not found",
        code: "EMPLOYEE_NOT_FOUND" 
      }, { status: 400 });
    }

    if (!validateDateFormat(date)) {
      return NextResponse.json({ 
        error: "Invalid date format. Use YYYY-MM-DD",
        code: "INVALID_DATE_FORMAT" 
      }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    if (checkIn && !validateTimeFormat(checkIn)) {
      return NextResponse.json({ 
        error: "Invalid checkIn time format. Use HH:MM or HH:MM:SS",
        code: "INVALID_CHECKIN_FORMAT" 
      }, { status: 400 });
    }

    if (checkOut && !validateTimeFormat(checkOut)) {
      return NextResponse.json({ 
        error: "Invalid checkOut time format. Use HH:MM or HH:MM:SS",
        code: "INVALID_CHECKOUT_FORMAT" 
      }, { status: 400 });
    }

    const newAttendance = await db.insert(attendance)
      .values({
        employeeId: empId,
        date: date.trim(),
        status: status.trim(),
        checkIn: checkIn ? checkIn.trim() : null,
        checkOut: checkOut ? checkOut.trim() : null,
        notes: notes ? notes.trim() : null,
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json(newAttendance[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const attendanceId = parseInt(id);
    
    const existingRecord = await db.select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Attendance record not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { checkIn, checkOut, status, notes } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    if (checkIn && !validateTimeFormat(checkIn)) {
      return NextResponse.json({ 
        error: "Invalid checkIn time format. Use HH:MM or HH:MM:SS",
        code: "INVALID_CHECKIN_FORMAT" 
      }, { status: 400 });
    }

    if (checkOut && !validateTimeFormat(checkOut)) {
      return NextResponse.json({ 
        error: "Invalid checkOut time format. Use HH:MM or HH:MM:SS",
        code: "INVALID_CHECKOUT_FORMAT" 
      }, { status: 400 });
    }

    const updates: any = {};
    if (checkIn !== undefined) updates.checkIn = checkIn ? checkIn.trim() : null;
    if (checkOut !== undefined) updates.checkOut = checkOut ? checkOut.trim() : null;
    if (status !== undefined) updates.status = status.trim();
    if (notes !== undefined) updates.notes = notes ? notes.trim() : null;

    const updatedRecord = await db.update(attendance)
      .set(updates)
      .where(eq(attendance.id, attendanceId))
      .returning();

    return NextResponse.json(updatedRecord[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const attendanceId = parseInt(id);

    const existingRecord = await db.select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Attendance record not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(attendance)
      .where(eq(attendance.id, attendanceId))
      .returning();

    return NextResponse.json({
      message: 'Attendance record deleted successfully',
      deleted: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}