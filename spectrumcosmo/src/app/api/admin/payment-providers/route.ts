import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET – all providers (admin view)
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const providers = await sql`
      SELECT * FROM payment_providers 
      ORDER BY type ASC, display_order ASC
    `;
    return NextResponse.json(providers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – add new provider
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
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

    const sql = getDb();
    const [provider] = await sql`
      INSERT INTO payment_providers (
        name, type, category, is_enabled, display_order, 
        logo_url, account_name, account_number, branch, instructions
      ) VALUES (
        ${name}, ${type}, ${category}, ${is_enabled ?? true}, ${display_order ?? 0},
        ${logo_url || null}, ${account_name || null}, ${account_number || null}, 
        ${branch || null}, ${instructions || null}
      )
      RETURNING *
    `;

    return NextResponse.json(provider, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH – update provider
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const sql = getDb();
    const [provider] = await sql`
      UPDATE payment_providers
      SET 
        name = COALESCE(${updates.name}, name),
        type = COALESCE(${updates.type}, type),
        category = COALESCE(${updates.category}, category),
        is_enabled = COALESCE(${updates.is_enabled}, is_enabled),
        display_order = COALESCE(${updates.display_order}, display_order),
        logo_url = COALESCE(${updates.logo_url}, logo_url),
        account_name = COALESCE(${updates.account_name}, account_name),
        account_number = COALESCE(${updates.account_number}, account_number),
        branch = COALESCE(${updates.branch}, branch),
        instructions = COALESCE(${updates.instructions}, instructions),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(provider);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE – remove provider
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM payment_providers WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
