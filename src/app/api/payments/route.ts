import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, invoices } from '@/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'completed', 'failed'];
const VALID_PAYMENT_MODES = ['cash', 'card', 'upi', 'bank_transfer', 'cheque'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const paymentId = parseInt(id);
      if (isNaN(paymentId)) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const payment = await db.select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (payment.length === 0) {
        return NextResponse.json({ 
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(payment[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const invoiceId = searchParams.get('invoice_id');
    const paymentMode = searchParams.get('payment_mode');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const conditions = [];

    if (invoiceId) {
      const invoiceIdInt = parseInt(invoiceId);
      if (isNaN(invoiceIdInt)) {
        return NextResponse.json({ 
          error: 'Valid invoice ID is required',
          code: 'INVALID_INVOICE_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(payments.invoiceId, invoiceIdInt));
    }

    if (paymentMode) {
      if (!VALID_PAYMENT_MODES.includes(paymentMode)) {
        return NextResponse.json({ 
          error: `Invalid payment mode. Valid values: ${VALID_PAYMENT_MODES.join(', ')}`,
          code: 'INVALID_PAYMENT_MODE' 
        }, { status: 400 });
      }
      conditions.push(eq(payments.paymentMode, paymentMode));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(payments.status, status));
    }

    if (fromDate) {
      conditions.push(gte(payments.paymentDate, fromDate));
    }

    if (toDate) {
      conditions.push(lte(payments.paymentDate, toDate));
    }

    let query = db.select().from(payments);
    let countQuery = db.select({ count: count() }).from(payments);

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const results = await query.limit(limit).offset(offset);
    const totalCount = await countQuery;

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

    const { invoiceId, paymentDate, amount, paymentMode, transactionId, bankName, status } = body;

    if (!invoiceId) {
      return NextResponse.json({ 
        error: 'Invoice ID is required',
        code: 'MISSING_INVOICE_ID' 
      }, { status: 400 });
    }

    if (!paymentDate) {
      return NextResponse.json({ 
        error: 'Payment date is required',
        code: 'MISSING_PAYMENT_DATE' 
      }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ 
        error: 'Amount is required',
        code: 'MISSING_AMOUNT' 
      }, { status: 400 });
    }

    if (!paymentMode) {
      return NextResponse.json({ 
        error: 'Payment mode is required',
        code: 'MISSING_PAYMENT_MODE' 
      }, { status: 400 });
    }

    const invoiceIdInt = parseInt(invoiceId);
    if (isNaN(invoiceIdInt)) {
      return NextResponse.json({ 
        error: 'Invoice ID must be a valid number',
        code: 'INVALID_INVOICE_ID' 
      }, { status: 400 });
    }

    const amountInt = parseInt(amount);
    if (isNaN(amountInt) || amountInt <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT' 
      }, { status: 400 });
    }

    if (!VALID_PAYMENT_MODES.includes(paymentMode)) {
      return NextResponse.json({ 
        error: `Invalid payment mode. Valid values: ${VALID_PAYMENT_MODES.join(', ')}`,
        code: 'INVALID_PAYMENT_MODE' 
      }, { status: 400 });
    }

    const paymentStatus = status || 'completed';
    if (!VALID_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    const invoice = await db.select()
      .from(invoices)
      .where(eq(invoices.id, invoiceIdInt))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json({ 
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND' 
      }, { status: 400 });
    }

    const newPayment = await db.insert(payments)
      .values({
        invoiceId: invoiceIdInt,
        paymentDate: paymentDate.trim(),
        amount: amountInt,
        paymentMode: paymentMode.trim(),
        transactionId: transactionId?.trim() || null,
        bankName: bankName?.trim() || null,
        status: paymentStatus,
        createdAt: Date.now()
      })
      .returning();

    return NextResponse.json(newPayment[0], { status: 201 });

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
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const paymentId = parseInt(id);
    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const { paymentDate, amount, paymentMode, transactionId, bankName, status } = body;

    const updates: any = {};

    if (paymentDate !== undefined) {
      updates.paymentDate = paymentDate.trim();
    }

    if (amount !== undefined) {
      const amountInt = parseInt(amount);
      if (isNaN(amountInt) || amountInt <= 0) {
        return NextResponse.json({ 
          error: 'Amount must be a positive number',
          code: 'INVALID_AMOUNT' 
        }, { status: 400 });
      }
      updates.amount = amountInt;
    }

    if (paymentMode !== undefined) {
      if (!VALID_PAYMENT_MODES.includes(paymentMode)) {
        return NextResponse.json({ 
          error: `Invalid payment mode. Valid values: ${VALID_PAYMENT_MODES.join(', ')}`,
          code: 'INVALID_PAYMENT_MODE' 
        }, { status: 400 });
      }
      updates.paymentMode = paymentMode.trim();
    }

    if (transactionId !== undefined) {
      updates.transactionId = transactionId?.trim() || null;
    }

    if (bankName !== undefined) {
      updates.bankName = bankName?.trim() || null;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingPayment[0]);
    }

    const updatedPayment = await db.update(payments)
      .set(updates)
      .where(eq(payments.id, paymentId))
      .returning();

    return NextResponse.json(updatedPayment[0]);

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
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const paymentId = parseInt(id);

    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(payments)
      .where(eq(payments.id, paymentId))
      .returning();

    return NextResponse.json({
      message: 'Payment deleted successfully',
      payment: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}