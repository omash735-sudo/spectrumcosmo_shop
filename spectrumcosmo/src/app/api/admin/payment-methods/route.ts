import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();
  const body = await req.json();

  const { name, type, logo_url, account_number, branch, instructions } = body;

  if (!name) {
    return NextResponse.json({ error: 'Method name is required' }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: 'Payment type is required' }, { status: 400 });
  }

  const validTypes = ['mobile_money', 'bank', 'cash', 'card'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO payment_methods (
        name,
        type,
        logo_url,
        account_number,
        branch,
        instructions,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${name},
        ${type},
        ${logo_url},
        ${account_number},
        ${branch},
        ${instructions},
        true,
        NOW(),
        NOW()
      )
    `;

    revalidatePath('/admin/payment-methods');
    return NextResponse.json({ success: 'Payment method added successfully' });
  } catch (err) {
    console.error('Failed to create payment method:', err);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}
