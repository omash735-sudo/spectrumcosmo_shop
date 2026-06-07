// app/api/admin/payment-options/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb, queryAsArray } from '@/lib/db';

// ============================================
// TYPES
// ============================================

interface PaymentOption {
  id: string;
  type: string;
  name: string;
  details: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreatePaymentOptionBody {
  type: string;
  name: string;
  details?: string;
  logo_url?: string;
}

interface UpdatePaymentOptionBody extends Partial<CreatePaymentOptionBody> {
  id: string;
  is_active?: boolean;
}

// ============================================
// HELPERS
// ============================================

function handleError(err: unknown): NextResponse {
  console.error('Payment options API error:', err);
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err instanceof Error ? err.message : 'Unknown error';
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}

// ============================================
// POST – create a new payment option
// ============================================
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body: CreatePaymentOptionBody = await req.json();
    const { type, name, details, logo_url } = body;

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Payment type is required' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Payment name is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<PaymentOption>`
      INSERT INTO payment_options (type, name, details, logo_url, is_active)
      VALUES (${type}, ${name}, ${details || null}, ${logo_url || null}, true)
      RETURNING *
    `;

    const newOption = result[0];
    if (!newOption) {
      return NextResponse.json({ error: 'Failed to create payment option' }, { status: 500 });
    }

    return NextResponse.json({ payment: newOption }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// PUT – update an existing payment option
// ============================================
export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body: UpdatePaymentOptionBody = await req.json();
    const { id, type, name, details, logo_url, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Payment option ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<PaymentOption>`
      UPDATE payment_options SET
        type = COALESCE(${type ?? null}, type),
        name = COALESCE(${name ?? null}, name),
        details = COALESCE(${details ?? null}, details),
        logo_url = COALESCE(${logo_url ?? null}, logo_url),
        is_active = COALESCE(${is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedOption = result[0];
    if (!updatedOption) {
      return NextResponse.json({ error: 'Payment option not found' }, { status: 404 });
    }

    return NextResponse.json({ payment: updatedOption });
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// DELETE – remove a payment option
// ============================================
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Payment option ID is required' }, { status: 400 });
    }

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
    return handleError(err);
  }
}
