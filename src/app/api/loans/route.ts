import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loans, customers, bookings } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'disbursed'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const loan = await db.select()
        .from(loans)
        .where(eq(loans.id, parseInt(id)))
        .limit(1);

      if (loan.length === 0) {
        return NextResponse.json({ 
          error: 'Loan not found',
          code: 'LOAN_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(loan[0]);
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const bankName = searchParams.get('bank_name');

    // Build conditions array
    const conditions = [];
    
    if (customerId) {
      if (isNaN(parseInt(customerId))) {
        return NextResponse.json({ 
          error: "Valid customer ID is required",
          code: "INVALID_CUSTOMER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(loans.customerId, parseInt(customerId)));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(loans.status, status));
    }

    if (bankName) {
      conditions.push(eq(loans.bankName, bankName));
    }

    // Execute query with filters
    let query = db.select().from(loans);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(loans);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const totalCount = await countQuery;
    const total = totalCount[0]?.count || 0;

    return NextResponse.json({
      data: results,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
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
    const { 
      customerId, 
      bookingId, 
      bankName, 
      loanAmount, 
      interestRate, 
      tenureMonths, 
      emiAmount, 
      appliedDate,
      status = 'pending',
      approvedDate 
    } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json({ 
        error: "Customer ID is required",
        code: "MISSING_CUSTOMER_ID" 
      }, { status: 400 });
    }

    if (!bankName || bankName.trim() === '') {
      return NextResponse.json({ 
        error: "Bank name is required",
        code: "MISSING_BANK_NAME" 
      }, { status: 400 });
    }

    if (!loanAmount || loanAmount <= 0) {
      return NextResponse.json({ 
        error: "Loan amount must be greater than 0",
        code: "INVALID_LOAN_AMOUNT" 
      }, { status: 400 });
    }

    if (!interestRate || interestRate <= 0) {
      return NextResponse.json({ 
        error: "Interest rate must be greater than 0",
        code: "INVALID_INTEREST_RATE" 
      }, { status: 400 });
    }

    if (!tenureMonths || tenureMonths <= 0) {
      return NextResponse.json({ 
        error: "Tenure months must be greater than 0",
        code: "INVALID_TENURE" 
      }, { status: 400 });
    }

    if (!emiAmount || emiAmount <= 0) {
      return NextResponse.json({ 
        error: "EMI amount must be greater than 0",
        code: "INVALID_EMI_AMOUNT" 
      }, { status: 400 });
    }

    if (!appliedDate || appliedDate.trim() === '') {
      return NextResponse.json({ 
        error: "Applied date is required",
        code: "MISSING_APPLIED_DATE" 
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate customer exists
    const customer = await db.select()
      .from(customers)
      .where(eq(customers.id, parseInt(customerId)))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ 
        error: "Customer not found",
        code: "CUSTOMER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate booking exists if provided
    if (bookingId) {
      const booking = await db.select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(bookingId)))
        .limit(1);

      if (booking.length === 0) {
        return NextResponse.json({ 
          error: "Booking not found",
          code: "BOOKING_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Create new loan
    const now = Date.now();
    const newLoan = await db.insert(loans)
      .values({
        customerId: parseInt(customerId),
        bookingId: bookingId ? parseInt(bookingId) : null,
        bankName: bankName.trim(),
        loanAmount: parseInt(loanAmount),
        interestRate: parseInt(interestRate),
        tenureMonths: parseInt(tenureMonths),
        emiAmount: parseInt(emiAmount),
        status: status,
        appliedDate: appliedDate,
        approvedDate: approvedDate || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newLoan[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if loan exists
    const existingLoan = await db.select()
      .from(loans)
      .where(eq(loans.id, parseInt(id)))
      .limit(1);

    if (existingLoan.length === 0) {
      return NextResponse.json({ 
        error: 'Loan not found',
        code: 'LOAN_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      customerId, 
      bookingId, 
      bankName, 
      loanAmount, 
      interestRate, 
      tenureMonths, 
      emiAmount, 
      status,
      appliedDate,
      approvedDate 
    } = body;

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now()
    };

    if (customerId !== undefined) {
      if (!customerId || customerId <= 0) {
        return NextResponse.json({ 
          error: "Valid customer ID is required",
          code: "INVALID_CUSTOMER_ID" 
        }, { status: 400 });
      }

      // Validate customer exists
      const customer = await db.select()
        .from(customers)
        .where(eq(customers.id, parseInt(customerId)))
        .limit(1);

      if (customer.length === 0) {
        return NextResponse.json({ 
          error: "Customer not found",
          code: "CUSTOMER_NOT_FOUND" 
        }, { status: 400 });
      }

      updates.customerId = parseInt(customerId);
    }

    if (bookingId !== undefined) {
      if (bookingId !== null) {
        // Validate booking exists
        const booking = await db.select()
          .from(bookings)
          .where(eq(bookings.id, parseInt(bookingId)))
          .limit(1);

        if (booking.length === 0) {
          return NextResponse.json({ 
            error: "Booking not found",
            code: "BOOKING_NOT_FOUND" 
          }, { status: 400 });
        }

        updates.bookingId = parseInt(bookingId);
      } else {
        updates.bookingId = null;
      }
    }

    if (bankName !== undefined) {
      if (!bankName || bankName.trim() === '') {
        return NextResponse.json({ 
          error: "Bank name cannot be empty",
          code: "INVALID_BANK_NAME" 
        }, { status: 400 });
      }
      updates.bankName = bankName.trim();
    }

    if (loanAmount !== undefined) {
      if (loanAmount <= 0) {
        return NextResponse.json({ 
          error: "Loan amount must be greater than 0",
          code: "INVALID_LOAN_AMOUNT" 
        }, { status: 400 });
      }
      updates.loanAmount = parseInt(loanAmount);
    }

    if (interestRate !== undefined) {
      if (interestRate <= 0) {
        return NextResponse.json({ 
          error: "Interest rate must be greater than 0",
          code: "INVALID_INTEREST_RATE" 
        }, { status: 400 });
      }
      updates.interestRate = parseInt(interestRate);
    }

    if (tenureMonths !== undefined) {
      if (tenureMonths <= 0) {
        return NextResponse.json({ 
          error: "Tenure months must be greater than 0",
          code: "INVALID_TENURE" 
        }, { status: 400 });
      }
      updates.tenureMonths = parseInt(tenureMonths);
    }

    if (emiAmount !== undefined) {
      if (emiAmount <= 0) {
        return NextResponse.json({ 
          error: "EMI amount must be greater than 0",
          code: "INVALID_EMI_AMOUNT" 
        }, { status: 400 });
      }
      updates.emiAmount = parseInt(emiAmount);
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = status;
    }

    if (appliedDate !== undefined) {
      if (!appliedDate || appliedDate.trim() === '') {
        return NextResponse.json({ 
          error: "Applied date cannot be empty",
          code: "INVALID_APPLIED_DATE" 
        }, { status: 400 });
      }
      updates.appliedDate = appliedDate;
    }

    if (approvedDate !== undefined) {
      updates.approvedDate = approvedDate || null;
    }

    // Update loan
    const updatedLoan = await db.update(loans)
      .set(updates)
      .where(eq(loans.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedLoan[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if loan exists
    const existingLoan = await db.select()
      .from(loans)
      .where(eq(loans.id, parseInt(id)))
      .limit(1);

    if (existingLoan.length === 0) {
      return NextResponse.json({ 
        error: 'Loan not found',
        code: 'LOAN_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete loan
    const deleted = await db.delete(loans)
      .where(eq(loans.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Loan deleted successfully',
      deleted: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}