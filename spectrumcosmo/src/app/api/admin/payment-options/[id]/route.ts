// app/api/admin/payment-options/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Types
interface PaymentOption {
  id: string;
  type: string | null;
  name: string;
  logo_url: string | null;
  account_number: string | null;
  is_active: boolean;
  sort_order: number;
  connector_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface UpdatePaymentOptionBody {
  type?: string;
  name: string;
  logo_url?: string | null;
  account_number?: string | null;
  is_active?: boolean;
  sort_order?: number;
  connector_id?: string | null;
}

// Helper to safely get numeric values
function toNumber(value: unknown, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Helper to safely get boolean
function toBoolean(value: unknown, defaultValue: boolean = true): boolean {
  if (typeof value === 'boolean') return value;
  return defaultValue;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const body: UpdatePaymentOptionBody = await req.json();
    const { type, name, logo_url, account_number, is_active, sort_order, connector_id } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<PaymentOption>`
      UPDATE payment_options
      SET
        type = COALESCE(${type || null}, type),
        name = ${name},
        logo_url = COALESCE(${logo_url || null}, logo_url),
        account_number = COALESCE(${account_number || null}, account_number),
        is_active = ${toBoolean(is_active, true)},
        sort_order = ${toNumber(sort_order, 0)},
        connector_id = COALESCE(${connector_id || null}, connector_id),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const updated = result[0];
    if (!updated) {
      return NextResponse.json({ error: 'Payment option not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/payment-options/[id] error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const sql = getDb();
    const result = await queryAsArray<{ id: string }>`
      DELETE FROM payment_options WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Payment option not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/payment-options/[id] error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
