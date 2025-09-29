import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { eq } from 'drizzle-orm';

const validStatuses = ['new', 'contacted', 'qualified'];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required" 
      }, { status: 400 });
    }

    const lead = await db.select()
      .from(leads)
      .where(eq(leads.id, parseInt(id)))
      .limit(1);

    if (lead.length === 0) {
      return NextResponse.json({ 
        error: "Lead not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      data: lead[0] 
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, email, source, status } = body;

    // Validation
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ 
        error: "Name must be non-empty" 
      }, { status: 400 });
    }

    if (phone !== undefined && (!phone || phone.trim() === '')) {
      return NextResponse.json({ 
        error: "Phone must be non-empty" 
      }, { status: 400 });
    }

    if (email !== undefined) {
      if (!email || email.trim() === '') {
        return NextResponse.json({ 
          error: "Email must be non-empty" 
        }, { status: 400 });
      }
      if (!validateEmail(email.trim())) {
        return NextResponse.json({ 
          error: "Email must be in valid format" 
        }, { status: 400 });
      }
    }

    if (source !== undefined && (!source || source.trim() === '')) {
      return NextResponse.json({ 
        error: "Source must be non-empty" 
      }, { status: 400 });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Status must be one of: new, contacted, qualified" 
      }, { status: 400 });
    }

    // Check if lead exists
    const existingLead = await db.select()
      .from(leads)
      .where(eq(leads.id, parseInt(id)))
      .limit(1);

    if (existingLead.length === 0) {
      return NextResponse.json({ 
        error: "Lead not found" 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (source !== undefined) updateData.source = source.trim();
    if (status !== undefined) updateData.status = status;

    const updated = await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      data: updated[0] 
    }, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required" 
      }, { status: 400 });
    }

    // Check if lead exists
    const existingLead = await db.select()
      .from(leads)
      .where(eq(leads.id, parseInt(id)))
      .limit(1);

    if (existingLead.length === 0) {
      return NextResponse.json({ 
        error: "Lead not found" 
      }, { status: 404 });
    }

    const deleted = await db.delete(leads)
      .where(eq(leads.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      data: { message: "Lead deleted successfully" } 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}