import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ledgerEntries } from '@/db/schema';
import { eq, like, and, gte, lte, desc, count, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const entry = await db.select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.id, parseInt(id)))
        .limit(1);

      if (entry.length === 0) {
        return NextResponse.json({ 
          error: 'Ledger entry not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(entry[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q') || searchParams.get('search');
    const accountType = searchParams.get('account_type');
    const category = searchParams.get('category');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(like(ledgerEntries.description, `%${search}%`));
    }

    if (accountType) {
      conditions.push(eq(ledgerEntries.accountType, accountType));
    }

    if (category) {
      conditions.push(eq(ledgerEntries.category, category));
    }

    if (fromDate) {
      conditions.push(gte(ledgerEntries.entryDate, fromDate));
    }

    if (toDate) {
      conditions.push(lte(ledgerEntries.entryDate, toDate));
    }

    // Get total count for pagination
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const totalCountResult = await db.select({ count: count() })
      .from(ledgerEntries)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated results
    let query = db.select()
      .from(ledgerEntries)
      .orderBy(desc(ledgerEntries.entryDate), desc(ledgerEntries.id));

    if (whereClause) {
      query = query.where(whereClause);
    }

    const entries = await query.limit(limit).offset(offset);

    return NextResponse.json({
      data: entries,
      meta: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + entries.length < totalCount
      }
    }, { status: 200 });

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

    // Validate required fields
    if (!body.entryDate) {
      return NextResponse.json({ 
        error: 'Entry date is required',
        code: 'MISSING_ENTRY_DATE' 
      }, { status: 400 });
    }

    if (!body.accountType) {
      return NextResponse.json({ 
        error: 'Account type is required',
        code: 'MISSING_ACCOUNT_TYPE' 
      }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ 
        error: 'Category is required',
        code: 'MISSING_CATEGORY' 
      }, { status: 400 });
    }

    if (!body.description) {
      return NextResponse.json({ 
        error: 'Description is required',
        code: 'MISSING_DESCRIPTION' 
      }, { status: 400 });
    }

    if (body.balance === undefined || body.balance === null) {
      return NextResponse.json({ 
        error: 'Balance is required',
        code: 'MISSING_BALANCE' 
      }, { status: 400 });
    }

    // Validate date format (ISO date)
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    if (!datePattern.test(body.entryDate)) {
      return NextResponse.json({ 
        error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    // Validate amounts
    const debitAmount = body.debitAmount !== undefined ? parseInt(body.debitAmount) : 0;
    const creditAmount = body.creditAmount !== undefined ? parseInt(body.creditAmount) : 0;

    if (isNaN(debitAmount) || debitAmount < 0) {
      return NextResponse.json({ 
        error: 'Debit amount must be a non-negative number',
        code: 'INVALID_DEBIT_AMOUNT' 
      }, { status: 400 });
    }

    if (isNaN(creditAmount) || creditAmount < 0) {
      return NextResponse.json({ 
        error: 'Credit amount must be a non-negative number',
        code: 'INVALID_CREDIT_AMOUNT' 
      }, { status: 400 });
    }

    if (debitAmount === 0 && creditAmount === 0) {
      return NextResponse.json({ 
        error: 'At least one of debit or credit amount must be greater than 0',
        code: 'INVALID_AMOUNTS' 
      }, { status: 400 });
    }

    // Validate balance
    const balance = parseInt(body.balance);
    if (isNaN(balance)) {
      return NextResponse.json({ 
        error: 'Balance must be a valid number',
        code: 'INVALID_BALANCE' 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      entryDate: body.entryDate.trim(),
      accountType: body.accountType.trim(),
      category: body.category.trim(),
      description: body.description.trim(),
      debitAmount,
      creditAmount,
      balance,
      referenceType: body.referenceType ? body.referenceType.trim() : null,
      referenceId: body.referenceId ? parseInt(body.referenceId) : null,
      createdAt: Date.now()
    };

    // Validate referenceId if provided
    if (insertData.referenceId !== null && isNaN(insertData.referenceId)) {
      return NextResponse.json({ 
        error: 'Reference ID must be a valid number',
        code: 'INVALID_REFERENCE_ID' 
      }, { status: 400 });
    }

    const newEntry = await db.insert(ledgerEntries)
      .values(insertData)
      .returning();

    return NextResponse.json(newEntry[0], { status: 201 });

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

    // Check if record exists
    const existing = await db.select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Ledger entry not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.entryDate !== undefined) {
      const datePattern = /^\d{4}-\d{2}-\d{2}/;
      if (!datePattern.test(body.entryDate)) {
        return NextResponse.json({ 
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }
      updates.entryDate = body.entryDate.trim();
    }

    if (body.accountType !== undefined) {
      updates.accountType = body.accountType.trim();
    }

    if (body.category !== undefined) {
      updates.category = body.category.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim();
    }

    if (body.debitAmount !== undefined) {
      const debitAmount = parseInt(body.debitAmount);
      if (isNaN(debitAmount) || debitAmount < 0) {
        return NextResponse.json({ 
          error: 'Debit amount must be a non-negative number',
          code: 'INVALID_DEBIT_AMOUNT' 
        }, { status: 400 });
      }
      updates.debitAmount = debitAmount;
    }

    if (body.creditAmount !== undefined) {
      const creditAmount = parseInt(body.creditAmount);
      if (isNaN(creditAmount) || creditAmount < 0) {
        return NextResponse.json({ 
          error: 'Credit amount must be a non-negative number',
          code: 'INVALID_CREDIT_AMOUNT' 
        }, { status: 400 });
      }
      updates.creditAmount = creditAmount;
    }

    // Validate that at least one amount is > 0
    const finalDebitAmount = updates.debitAmount !== undefined ? updates.debitAmount : existing[0].debitAmount;
    const finalCreditAmount = updates.creditAmount !== undefined ? updates.creditAmount : existing[0].creditAmount;
    
    if (finalDebitAmount === 0 && finalCreditAmount === 0) {
      return NextResponse.json({ 
        error: 'At least one of debit or credit amount must be greater than 0',
        code: 'INVALID_AMOUNTS' 
      }, { status: 400 });
    }

    if (body.balance !== undefined) {
      const balance = parseInt(body.balance);
      if (isNaN(balance)) {
        return NextResponse.json({ 
          error: 'Balance must be a valid number',
          code: 'INVALID_BALANCE' 
        }, { status: 400 });
      }
      updates.balance = balance;
    }

    if (body.referenceType !== undefined) {
      updates.referenceType = body.referenceType ? body.referenceType.trim() : null;
    }

    if (body.referenceId !== undefined) {
      const referenceId = body.referenceId ? parseInt(body.referenceId) : null;
      if (referenceId !== null && isNaN(referenceId)) {
        return NextResponse.json({ 
          error: 'Reference ID must be a valid number',
          code: 'INVALID_REFERENCE_ID' 
        }, { status: 400 });
      }
      updates.referenceId = referenceId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATES' 
      }, { status: 400 });
    }

    const updated = await db.update(ledgerEntries)
      .set(updates)
      .where(eq(ledgerEntries.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

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

    // Check if record exists
    const existing = await db.select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Ledger entry not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(ledgerEntries)
      .where(eq(ledgerEntries.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Ledger entry deleted successfully',
      deletedEntry: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}