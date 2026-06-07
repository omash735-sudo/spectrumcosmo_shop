// app/api/admin/order-statuses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Types
interface OrderStatus {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreateStatusBody {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  display_order?: number;
}

interface UpdateStatusBody extends CreateStatusBody {
  id: string;
  is_active?: boolean;
}

// GET: List all order statuses
export async function GET(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const sql = getDb();
    const statuses = await queryAsArray<OrderStatus>`
      SELECT * FROM order_statuses ORDER BY display_order ASC
    `;

    return NextResponse.json(statuses);
  } catch (err) {
    console.error('GET /api/admin/order-statuses error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Create a new order status
export async function POST(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const body: CreateStatusBody = await req.json();
    const { name, slug, description, color, icon, display_order } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const sql = getDb();
    const result = await queryAsArray<OrderStatus>`
      INSERT INTO order_statuses (name, slug, description, color, icon, display_order, is_active)
      VALUES (${name}, ${finalSlug}, ${description || null}, ${color || 'gray'}, ${icon || 'Clock'}, ${display_order || 0}, true)
      RETURNING *
    `;

    const newStatus = result[0];
    if (!newStatus) {
      return NextResponse.json({ error: 'Failed to create order status' }, { status: 500 });
    }

    return NextResponse.json(newStatus, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/order-statuses error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH: Update an existing order status
export async function PATCH(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const body: UpdateStatusBody = await req.json();
    const { id, name, slug, description, color, icon, display_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<OrderStatus>`
      UPDATE order_statuses 
      SET 
        name = COALESCE(${name || null}, name),
        slug = COALESCE(${slug || null}, slug),
        description = COALESCE(${description || null}, description),
        color = COALESCE(${color || null}, color),
        icon = COALESCE(${icon || null}, icon),
        display_order = COALESCE(${display_order !== undefined ? display_order : null}, display_order),
        is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedStatus = result[0];
    if (!updatedStatus) {
      return NextResponse.json({ error: 'Order status not found' }, { status: 404 });
    }

    return NextResponse.json(updatedStatus);
  } catch (err) {
    console.error('PATCH /api/admin/order-statuses error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Remove an order status
export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<{ id: string }>`
      DELETE FROM order_statuses WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Order status not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/order-statuses error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
