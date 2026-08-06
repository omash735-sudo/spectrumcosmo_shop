import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);

  if (error) {
    return error;
  }

  try {
    const sql = getDb();
    const escalations = await sql`
      SELECT 
        e.id,
        e.reason,
        e.context,
        e.status,
        e.created_at,
        c.customer_name,
        c.customer_email,
        c.session_id
      FROM ella_escalations e
      JOIN ella_conversations c ON e.conversation_id = c.id
      WHERE e.status = 'pending'
      ORDER BY e.created_at DESC
    `;

    return NextResponse.json({ escalations });
  } catch (error) {
    console.error('Admin escalations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalations' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);

  if (error) {
    return error;
  }

  try {
    const body = await req.json();
    const { escalationId, status } = body;

    if (!escalationId || !status) {
      return NextResponse.json(
        { error: 'Escalation ID and status are required' },
        { status: 400 }
      );
    }

    if (!['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "resolved" or "dismissed"' },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`
      UPDATE ella_escalations 
      SET 
        status = ${status},
        resolved_by = ${user.id},
        resolved_at = NOW()
      WHERE id = ${escalationId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update escalation error:', error);
    return NextResponse.json(
      { error: 'Failed to update escalation' },
      { status: 500 }
    );
  }
}
