import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { eq, like, and, or, desc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;

    let query = db.select().from(vehicles);
    let countQuery = db.select({ count: count() }).from(vehicles);

    const conditions = [];

    if (q) {
      const searchCondition = or(
        like(vehicles.make, `%${q}%`),
        like(vehicles.model, `%${q}%`),
        like(vehicles.vin, `%${q}%`)
      );
      conditions.push(searchCondition);
    }

    if (category) {
      conditions.push(eq(vehicles.category, category));
    }

    if (status) {
      conditions.push(eq(vehicles.status, status));
    }

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    const [data, totalResult] = await Promise.all([
      query.orderBy(desc(vehicles.createdAt)).limit(pageSize).offset(offset),
      countQuery
    ]);

    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data,
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
    const body = await request.json();
    const {
      vin,
      make,
      model,
      year,
      category,
      color,
      price,
      stock,
      reorderPoint,
      status
    } = body;

    // Validation
    if (!vin || typeof vin !== 'string' || vin.trim() === '') {
      return NextResponse.json({ 
        error: 'VIN is required and must be non-empty' 
      }, { status: 400 });
    }

    if (!make || typeof make !== 'string' || make.trim() === '') {
      return NextResponse.json({ 
        error: 'Make is required and must be non-empty' 
      }, { status: 400 });
    }

    if (!model || typeof model !== 'string' || model.trim() === '') {
      return NextResponse.json({ 
        error: 'Model is required and must be non-empty' 
      }, { status: 400 });
    }

    if (!year || typeof year !== 'number' || year < 1900) {
      return NextResponse.json({ 
        error: 'Year is required and must be an integer >= 1900' 
      }, { status: 400 });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({ 
        error: 'Category is required and must be non-empty' 
      }, { status: 400 });
    }

    if (!color || typeof color !== 'string' || color.trim() === '') {
      return NextResponse.json({ 
        error: 'Color is required and must be non-empty' 
      }, { status: 400 });
    }

    if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ 
        error: 'Price is required and must be an integer >= 0' 
      }, { status: 400 });
    }

    if (stock === undefined || stock === null || typeof stock !== 'number' || stock < 0) {
      return NextResponse.json({ 
        error: 'Stock is required and must be an integer >= 0' 
      }, { status: 400 });
    }

    if (reorderPoint === undefined || reorderPoint === null || typeof reorderPoint !== 'number' || reorderPoint < 0) {
      return NextResponse.json({ 
        error: 'Reorder point is required and must be an integer >= 0' 
      }, { status: 400 });
    }

    if (!status || !['in_stock', 'reserved', 'sold'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status is required and must be one of: in_stock, reserved, sold' 
      }, { status: 400 });
    }

    // Check for VIN uniqueness
    const existingVehicle = await db.select().from(vehicles).where(eq(vehicles.vin, vin.trim())).limit(1);
    if (existingVehicle.length > 0) {
      return NextResponse.json({ 
        error: 'VIN must be unique' 
      }, { status: 400 });
    }

    const now = Date.now();
    const newVehicle = await db.insert(vehicles).values({
      vin: vin.trim(),
      make: make.trim(),
      model: model.trim(),
      year,
      category: category.trim(),
      color: color.trim(),
      price,
      stock,
      reorderPoint,
      status,
      createdAt: now,
      updatedAt: now
    }).returning();

    return NextResponse.json({ 
      data: newVehicle[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'VIN must be unique' 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}