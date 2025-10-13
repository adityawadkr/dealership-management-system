import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq, like, or, and, count } from 'drizzle-orm';

// GET - List customers with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single customer fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const customer = await db.select()
        .from(customers)
        .where(eq(customers.id, parseInt(id)))
        .limit(1);

      if (customer.length === 0) {
        return NextResponse.json({ 
          error: 'Customer not found',
          code: "CUSTOMER_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(customer[0], { status: 200 });
    }

    // List customers with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const q = searchParams.get('q');
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    // Build conditions array
    const conditions = [];

    // Search condition - search across name, email, phone
    if (q) {
      conditions.push(
        or(
          like(customers.name, `%${q}%`),
          like(customers.email, `%${q}%`),
          like(customers.phone, `%${q}%`)
        )
      );
    }

    // Filter by city
    if (city) {
      conditions.push(eq(customers.city, city));
    }

    // Filter by state
    if (state) {
      conditions.push(eq(customers.state, state));
    }

    // Build query
    let query = db.select().from(customers);
    let countQuery = db.select({ count: count() }).from(customers);

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    // Execute queries
    const [customersList, totalCountResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      data: customersList,
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
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, state, pincode, pan, aadhar, gstin } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ 
        error: "Phone is required",
        code: "MISSING_PHONE" 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }

    // Validate phone format (basic validation for digits and common formats)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ 
        error: "Invalid phone format",
        code: "INVALID_PHONE_FORMAT" 
      }, { status: 400 });
    }

    // Check email uniqueness
    const existingCustomer = await db.select()
      .from(customers)
      .where(eq(customers.email, email.trim().toLowerCase()))
      .limit(1);

    if (existingCustomer.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "DUPLICATE_EMAIL" 
      }, { status: 400 });
    }

    // Prepare insert data
    const now = Date.now();
    const insertData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      pan: pan ? pan.trim().toUpperCase() : null,
      aadhar: aadhar ? aadhar.trim() : null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      createdAt: now,
      updatedAt: now
    };

    const newCustomer = await db.insert(customers)
      .values(insertData)
      .returning();

    return NextResponse.json(newCustomer[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT - Update customer by ID
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if customer exists
    const existingCustomer = await db.select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json({ 
        error: 'Customer not found',
        code: "CUSTOMER_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, address, city, state, pincode, pan, aadhar, gstin } = body;

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: Date.now()
    };

    // Validate and add name if provided
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    // Validate and add email if provided
    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json({ 
          error: "Email cannot be empty",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT" 
        }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      
      // Check email uniqueness if changed
      if (normalizedEmail !== existingCustomer[0].email) {
        const emailExists = await db.select()
          .from(customers)
          .where(eq(customers.email, normalizedEmail))
          .limit(1);

        if (emailExists.length > 0) {
          return NextResponse.json({ 
            error: "Email already exists",
            code: "DUPLICATE_EMAIL" 
          }, { status: 400 });
        }
      }

      updateData.email = normalizedEmail;
    }

    // Validate and add phone if provided
    if (phone !== undefined) {
      if (!phone.trim()) {
        return NextResponse.json({ 
          error: "Phone cannot be empty",
          code: "INVALID_PHONE" 
        }, { status: 400 });
      }

      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json({ 
          error: "Invalid phone format",
          code: "INVALID_PHONE_FORMAT" 
        }, { status: 400 });
      }

      updateData.phone = phone.trim();
    }

    // Add optional fields
    if (address !== undefined) {
      updateData.address = address ? address.trim() : null;
    }

    if (city !== undefined) {
      updateData.city = city ? city.trim() : null;
    }

    if (state !== undefined) {
      updateData.state = state ? state.trim() : null;
    }

    if (pincode !== undefined) {
      updateData.pincode = pincode ? pincode.trim() : null;
    }

    if (pan !== undefined) {
      updateData.pan = pan ? pan.trim().toUpperCase() : null;
    }

    if (aadhar !== undefined) {
      updateData.aadhar = aadhar ? aadhar.trim() : null;
    }

    if (gstin !== undefined) {
      updateData.gstin = gstin ? gstin.trim().toUpperCase() : null;
    }

    const updatedCustomer = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCustomer[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE - Delete customer by ID
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if customer exists
    const existingCustomer = await db.select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json({ 
        error: 'Customer not found',
        code: "CUSTOMER_NOT_FOUND" 
      }, { status: 404 });
    }

    const deletedCustomer = await db.delete(customers)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Customer deleted successfully',
      customer: deletedCustomer[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}