import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors } from '@/db/schema';
import { eq, like, or, and, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - List vendors with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single vendor fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const vendor = await db.select()
        .from(vendors)
        .where(eq(vendors.id, parseInt(id)))
        .limit(1);

      if (vendor.length === 0) {
        return NextResponse.json({ 
          error: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(vendor[0], { status: 200 });
    }

    // List vendors with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('q') || searchParams.get('search');
    const statusFilter = searchParams.get('status');

    let whereConditions = [];

    // Search across name and vendorCode
    if (search) {
      whereConditions.push(
        or(
          like(vendors.name, `%${search}%`),
          like(vendors.vendorCode, `%${search}%`)
        )
      );
    }

    // Filter by status
    if (statusFilter) {
      whereConditions.push(eq(vendors.status, statusFilter));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalCountResult = await db.select({ count: count() })
      .from(vendors)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated results
    let query = db.select().from(vendors);
    
    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(vendors.createdAt);

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + results.length < totalCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET vendors error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// POST - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.vendorCode || !body.vendorCode.trim()) {
      return NextResponse.json({ 
        error: "Vendor code is required",
        code: "MISSING_VENDOR_CODE" 
      }, { status: 400 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ 
        error: "Vendor name is required",
        code: "MISSING_VENDOR_NAME" 
      }, { status: 400 });
    }

    // Validate email format if provided
    if (body.email && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
    }

    // Validate status if provided
    const validStatuses = ['active', 'inactive'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be 'active' or 'inactive'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Check for duplicate vendor code
    const existingVendor = await db.select()
      .from(vendors)
      .where(eq(vendors.vendorCode, body.vendorCode.trim()))
      .limit(1);

    if (existingVendor.length > 0) {
      return NextResponse.json({ 
        error: "Vendor code already exists",
        code: "DUPLICATE_VENDOR_CODE" 
      }, { status: 400 });
    }

    // Prepare insert data
    const now = Date.now();
    const insertData = {
      vendorCode: body.vendorCode.trim(),
      name: body.name.trim(),
      contactPerson: body.contactPerson ? body.contactPerson.trim() : null,
      email: body.email ? body.email.trim().toLowerCase() : null,
      phone: body.phone ? body.phone.trim() : null,
      address: body.address ? body.address.trim() : null,
      gstin: body.gstin ? body.gstin.trim().toUpperCase() : null,
      paymentTerms: body.paymentTerms ? body.paymentTerms.trim() : null,
      status: body.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    const newVendor = await db.insert(vendors)
      .values(insertData)
      .returning();

    return NextResponse.json(newVendor[0], { status: 201 });

  } catch (error) {
    console.error('POST vendors error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT - Update vendor by ID
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

    // Check if vendor exists
    const existingVendor = await db.select()
      .from(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .limit(1);

    if (existingVendor.length === 0) {
      return NextResponse.json({ 
        error: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();

    // Validate email format if provided
    if (body.email && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
    }

    // Validate status if provided
    const validStatuses = ['active', 'inactive'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be 'active' or 'inactive'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Check for duplicate vendor code if being changed
    if (body.vendorCode && body.vendorCode.trim() !== existingVendor[0].vendorCode) {
      const duplicateCheck = await db.select()
        .from(vendors)
        .where(eq(vendors.vendorCode, body.vendorCode.trim()))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json({ 
          error: "Vendor code already exists",
          code: "DUPLICATE_VENDOR_CODE" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (body.vendorCode !== undefined) updateData.vendorCode = body.vendorCode.trim();
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson ? body.contactPerson.trim() : null;
    if (body.email !== undefined) updateData.email = body.email ? body.email.trim().toLowerCase() : null;
    if (body.phone !== undefined) updateData.phone = body.phone ? body.phone.trim() : null;
    if (body.address !== undefined) updateData.address = body.address ? body.address.trim() : null;
    if (body.gstin !== undefined) updateData.gstin = body.gstin ? body.gstin.trim().toUpperCase() : null;
    if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms ? body.paymentTerms.trim() : null;
    if (body.status !== undefined) updateData.status = body.status;

    const updatedVendor = await db.update(vendors)
      .set(updateData)
      .where(eq(vendors.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedVendor[0], { status: 200 });

  } catch (error) {
    console.error('PUT vendors error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE - Delete vendor by ID
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

    // Check if vendor exists
    const existingVendor = await db.select()
      .from(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .limit(1);

    if (existingVendor.length === 0) {
      return NextResponse.json({ 
        error: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedVendor = await db.delete(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Vendor deleted successfully',
      vendor: deletedVendor[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE vendors error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}