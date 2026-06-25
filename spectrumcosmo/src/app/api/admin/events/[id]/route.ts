import { NextRequest, NextResponse } from 'next/server';
import { getDb, execute } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      badge,
      title,
      detail,
      href,
      google_form_link,
      starts_at,
      ends_at,
      active,
    } = body;

    const sql = getDb();

    await execute`
      UPDATE site_events SET
        badge = ${badge},
        title = ${title},
        detail = ${detail},
        href = ${href},
        google_form_link = ${google_form_link},
        starts_at = ${starts_at || null},
        ends_at = ${ends_at || null},
        active = ${active || true},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const sql = getDb();

    await execute`
      DELETE FROM site_events WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
