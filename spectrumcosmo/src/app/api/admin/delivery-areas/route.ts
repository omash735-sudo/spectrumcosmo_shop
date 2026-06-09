import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const sql = getDb();
    const areas = await queryAsArray`
      SELECT id, area_name, city, delivery_fee, estimated_days, is_active, created_at, updated_at
      FROM delivery_areas
      ORDER BY created_at DESC
    `;
    return NextResponse.json(areas);
  } catch (err) {
    console.error('Failed to fetch delivery areas:', err);
    return NextResponse.json({ error: 'Failed to fetch delivery areas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { area_name, city, delivery_fee, estimated_days, is_active } = body;

    if (!area_name || !city || delivery_fee === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();
    const [area] = await sql`
      INSERT INTO delivery_areas (area_name, city, delivery_fee, estimated_days, is_active)
      VALUES (${area_name}, ${city}, ${delivery_fee}, ${estimated_days || null}, ${is_active ?? true})
      RETURNING *
    `;

    return NextResponse.json(area, { status: 201 });
  } catch (err) {
    console.error('Failed to create delivery area:', err);
    return NextResponse.json({ error: 'Failed to create delivery area' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, area_name, city, delivery_fee, estimated_days, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    const [area] = await sql`
      UPDATE delivery_areas
      SET area_name = ${area_name},
          city = ${city},
          delivery_fee = ${delivery_fee},
          estimated_days = ${estimated_days},
          is_active = ${is_active},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!area) {
      return NextResponse.json({ error: 'Delivery area not found' }, { status: 404 });
    }

    return NextResponse.json(area);
  } catch (err) {
    console.error('Failed to update delivery area:', err);
    return NextResponse.json({ error: 'Failed to update delivery area' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM delivery_areas WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete delivery area:', err);
    return NextResponse.json({ error: 'Failed to delete delivery area' }, { status: 500 });
  }
}
