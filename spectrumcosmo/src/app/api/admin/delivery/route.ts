import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb, queryAsArray } from '@/lib/db';

interface DeliveryMethod {
  id: string;
  name: string;
  price: number;
  logo_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Create a new delivery method
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { name, price, logo_url } = await req.json();

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<DeliveryMethod>`
      INSERT INTO delivery_methods (name, price, logo_url)
      VALUES (${name.trim()}, ${numericPrice}, ${logo_url || null})
      RETURNING *
    `;

    const newMethod = result[0];
    if (!newMethod) {
      return NextResponse.json({ error: 'Failed to create delivery method' }, { status: 500 });
    }

    return NextResponse.json({ delivery: newMethod }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/delivery-methods error:', err);
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update an existing delivery method
export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, name, price, logo_url } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<DeliveryMethod>`
      UPDATE delivery_methods SET
        name = COALESCE(${name || null}, name),
        price = COALESCE(${price !== undefined ? Number(price) : null}, price),
        logo_url = COALESCE(${logo_url || null}, logo_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedMethod = result[0];
    if (!updatedMethod) {
      return NextResponse.json({ error: 'Delivery method not found' }, { status: 404 });
    }

    return NextResponse.json({ delivery: updatedMethod });
  } catch (err) {
    console.error('PUT /api/admin/delivery-methods error:', err);
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a delivery method
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<{ id: string }>`
      DELETE FROM delivery_methods WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Delivery method not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/delivery-methods error:', err);
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
