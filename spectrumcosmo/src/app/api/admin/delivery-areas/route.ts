import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const sql = getDb();
    const areas = await sql`
      SELECT 
        id, 
        area_name, 
        city, 
        base_fee, 
        express_multiplier,
        estimated_days_standard,
        estimated_days_express,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM delivery_areas
      ORDER BY sort_order ASC, city ASC, area_name ASC
    `;

    const formatted = areas.map((area) => ({
      ...area,
      base_fee: Number(area.base_fee),
      express_multiplier: Number(area.express_multiplier),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('GET /api/admin/delivery-areas error:', err);
    return NextResponse.json({ error: 'Failed to fetch delivery areas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const body = await req.json();
    const { 
      area_name, 
      city, 
      base_fee, 
      express_multiplier, 
      estimated_days_standard, 
      estimated_days_express, 
      is_active, 
      sort_order 
    } = body;

    if (!area_name || !city || base_fee === undefined) {
      return NextResponse.json({ error: 'Area name, city, and base fee are required' }, { status: 400 });
    }

    const sql = getDb();
    const [newArea] = await sql`
      INSERT INTO delivery_areas (
        area_name, city, base_fee, express_multiplier, 
        estimated_days_standard, estimated_days_express, is_active, sort_order
      ) VALUES (
        ${area_name}, ${city}, ${base_fee}, ${express_multiplier || 1.5},
        ${estimated_days_standard || null}, ${estimated_days_express || null}, 
        ${is_active ?? true}, ${sort_order || 0}
      )
      RETURNING *
    `;

    return NextResponse.json({
      ...newArea,
      base_fee: Number(newArea.base_fee),
      express_multiplier: Number(newArea.express_multiplier),
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/delivery-areas error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const body = await req.json();
    const { 
      id, area_name, city, base_fee, express_multiplier, 
      estimated_days_standard, estimated_days_express, is_active, sort_order 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    const [updated] = await sql`
      UPDATE delivery_areas
      SET 
        area_name = ${area_name},
        city = ${city},
        base_fee = ${base_fee},
        express_multiplier = ${express_multiplier},
        estimated_days_standard = ${estimated_days_standard},
        estimated_days_express = ${estimated_days_express},
        is_active = ${is_active},
        sort_order = ${sort_order},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Delivery area not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      base_fee: Number(updated.base_fee),
      express_multiplier: Number(updated.express_multiplier),
    });
  } catch (err: any) {
    console.error('PUT /api/admin/delivery-areas error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM delivery_areas WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/delivery-areas error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
