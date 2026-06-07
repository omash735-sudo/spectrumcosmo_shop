// app/api/admin/payment-providers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// ============================================
// TYPES
// ============================================

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
  category: string;
  is_enabled: boolean;
  display_order: number;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CreateProviderBody {
  name: string;
  type: string;
  category?: string;
  is_enabled?: boolean;
  display_order?: number;
  logo_url?: string;
  account_name?: string;
  account_number?: string;
  branch?: string;
  instructions?: string;
}

interface UpdateProviderBody extends Partial<CreateProviderBody> {
  id: string;
}

// ============================================
// HELPERS
// ============================================

function handleError(err: unknown): NextResponse {
  console.error('Payment providers API error:', err);
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err instanceof Error ? err.message : 'Unknown error';
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}

// ============================================
// GET – list all payment providers
// ============================================
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const providers = await queryAsArray<PaymentProvider>`
      SELECT * FROM payment_providers 
      ORDER BY type ASC, display_order ASC
    `;
    return NextResponse.json(providers);
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// POST – create a new payment provider
// ============================================
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body: CreateProviderBody = await req.json();
    const {
      name,
      type,
      category,
      is_enabled,
      display_order,
      logo_url,
      account_name,
      account_number,
      branch,
      instructions,
    } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
    }
    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Provider type is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<PaymentProvider>`
      INSERT INTO payment_providers (
        name, type, category, is_enabled, display_order, 
        logo_url, account_name, account_number, branch, instructions
      ) VALUES (
        ${name}, ${type}, ${category || null}, ${is_enabled ?? true}, ${display_order ?? 0},
        ${logo_url || null}, ${account_name || null}, ${account_number || null}, 
        ${branch || null}, ${instructions || null}
      )
      RETURNING *
    `;

    const newProvider = result[0];
    if (!newProvider) {
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
    }

    return NextResponse.json(newProvider, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// PATCH – update an existing provider
// ============================================
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body: UpdateProviderBody = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<PaymentProvider>`
      UPDATE payment_providers
      SET 
        name = COALESCE(${updates.name ?? null}, name),
        type = COALESCE(${updates.type ?? null}, type),
        category = COALESCE(${updates.category ?? null}, category),
        is_enabled = COALESCE(${updates.is_enabled ?? null}, is_enabled),
        display_order = COALESCE(${updates.display_order ?? null}, display_order),
        logo_url = COALESCE(${updates.logo_url ?? null}, logo_url),
        account_name = COALESCE(${updates.account_name ?? null}, account_name),
        account_number = COALESCE(${updates.account_number ?? null}, account_number),
        branch = COALESCE(${updates.branch ?? null}, branch),
        instructions = COALESCE(${updates.instructions ?? null}, instructions),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedProvider = result[0];
    if (!updatedProvider) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProvider);
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// DELETE – remove a payment provider
// ============================================
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const result = await queryAsArray<{ id: string }>`
      DELETE FROM payment_providers WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
