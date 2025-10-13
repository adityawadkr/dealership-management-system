import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { diagnostics, jobCards, employees } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const diagnostic = await db.select()
        .from(diagnostics)
        .where(eq(diagnostics.id, parseInt(id)))
        .limit(1);

      if (diagnostic.length === 0) {
        return NextResponse.json({ 
          error: 'Diagnostic not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(diagnostic[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const jobCardId = searchParams.get('job_card_id');
    const technicianId = searchParams.get('technician_id');

    // Build filter conditions
    const conditions = [];
    if (jobCardId) {
      if (isNaN(parseInt(jobCardId))) {
        return NextResponse.json({ 
          error: "Valid job_card_id is required",
          code: "INVALID_JOB_CARD_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(diagnostics.jobCardId, parseInt(jobCardId)));
    }
    if (technicianId) {
      if (isNaN(parseInt(technicianId))) {
        return NextResponse.json({ 
          error: "Valid technician_id is required",
          code: "INVALID_TECHNICIAN_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(diagnostics.technicianId, parseInt(technicianId)));
    }

    // Get total count
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    const totalCountResult = await db.select({ count: count() })
      .from(diagnostics)
      .where(whereCondition);
    const totalCount = totalCountResult[0].count;

    // Get paginated results
    let query = db.select().from(diagnostics);
    if (whereCondition) {
      query = query.where(whereCondition);
    }
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json({
      data: results,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobCardId, issueDescription, findings, recommendations, technicianId, completedAt } = body;

    // Validate required fields
    if (!jobCardId) {
      return NextResponse.json({ 
        error: "jobCardId is required",
        code: "MISSING_JOB_CARD_ID" 
      }, { status: 400 });
    }

    if (!issueDescription) {
      return NextResponse.json({ 
        error: "issueDescription is required",
        code: "MISSING_ISSUE_DESCRIPTION" 
      }, { status: 400 });
    }

    // Validate jobCardId type
    if (isNaN(parseInt(jobCardId))) {
      return NextResponse.json({ 
        error: "Valid jobCardId is required",
        code: "INVALID_JOB_CARD_ID" 
      }, { status: 400 });
    }

    // Validate jobCardId exists
    const jobCardExists = await db.select()
      .from(jobCards)
      .where(eq(jobCards.id, parseInt(jobCardId)))
      .limit(1);

    if (jobCardExists.length === 0) {
      return NextResponse.json({ 
        error: "Job card not found",
        code: "JOB_CARD_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate technicianId if provided
    if (technicianId) {
      if (isNaN(parseInt(technicianId))) {
        return NextResponse.json({ 
          error: "Valid technicianId is required",
          code: "INVALID_TECHNICIAN_ID" 
        }, { status: 400 });
      }

      const technicianExists = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(technicianId)))
        .limit(1);

      if (technicianExists.length === 0) {
        return NextResponse.json({ 
          error: "Technician not found",
          code: "TECHNICIAN_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Sanitize inputs
    const sanitizedIssueDescription = issueDescription.trim();

    // Prepare insert data
    const insertData: any = {
      jobCardId: parseInt(jobCardId),
      issueDescription: sanitizedIssueDescription,
      createdAt: Date.now()
    };

    if (findings !== undefined && findings !== null) {
      insertData.findings = findings.trim();
    }

    if (recommendations !== undefined && recommendations !== null) {
      insertData.recommendations = recommendations.trim();
    }

    if (technicianId !== undefined && technicianId !== null) {
      insertData.technicianId = parseInt(technicianId);
    }

    if (completedAt !== undefined && completedAt !== null) {
      insertData.completedAt = completedAt;
    }

    // Insert diagnostic
    const newDiagnostic = await db.insert(diagnostics)
      .values(insertData)
      .returning();

    return NextResponse.json(newDiagnostic[0], { status: 201 });

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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const diagnosticId = parseInt(id);

    // Check if diagnostic exists
    const existingDiagnostic = await db.select()
      .from(diagnostics)
      .where(eq(diagnostics.id, diagnosticId))
      .limit(1);

    if (existingDiagnostic.length === 0) {
      return NextResponse.json({ 
        error: 'Diagnostic not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { issueDescription, findings, recommendations, technicianId, completedAt } = body;

    // Validate technicianId if provided
    if (technicianId !== undefined && technicianId !== null) {
      if (isNaN(parseInt(technicianId))) {
        return NextResponse.json({ 
          error: "Valid technicianId is required",
          code: "INVALID_TECHNICIAN_ID" 
        }, { status: 400 });
      }

      const technicianExists = await db.select()
        .from(employees)
        .where(eq(employees.id, parseInt(technicianId)))
        .limit(1);

      if (technicianExists.length === 0) {
        return NextResponse.json({ 
          error: "Technician not found",
          code: "TECHNICIAN_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (issueDescription !== undefined) {
      updateData.issueDescription = issueDescription.trim();
    }

    if (findings !== undefined) {
      updateData.findings = findings !== null ? findings.trim() : null;
    }

    if (recommendations !== undefined) {
      updateData.recommendations = recommendations !== null ? recommendations.trim() : null;
    }

    if (technicianId !== undefined) {
      updateData.technicianId = technicianId !== null ? parseInt(technicianId) : null;
    }

    if (completedAt !== undefined) {
      updateData.completedAt = completedAt;
    }

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No fields to update",
        code: "NO_UPDATE_FIELDS" 
      }, { status: 400 });
    }

    // Update diagnostic
    const updated = await db.update(diagnostics)
      .set(updateData)
      .where(eq(diagnostics.id, diagnosticId))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const diagnosticId = parseInt(id);

    // Check if diagnostic exists
    const existingDiagnostic = await db.select()
      .from(diagnostics)
      .where(eq(diagnostics.id, diagnosticId))
      .limit(1);

    if (existingDiagnostic.length === 0) {
      return NextResponse.json({ 
        error: 'Diagnostic not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete diagnostic
    const deleted = await db.delete(diagnostics)
      .where(eq(diagnostics.id, diagnosticId))
      .returning();

    return NextResponse.json({
      message: 'Diagnostic deleted successfully',
      data: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}