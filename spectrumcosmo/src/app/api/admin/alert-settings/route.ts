// app/api/admin/alert-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const settings = await sql`
      SELECT email, receive_low_stock, receive_critical, receive_out_of_stock
      FROM admin_alert_settings
      ORDER BY email
    `;
    
    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    console.error('Failed to fetch alert settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { email, receive_low_stock, receive_critical, receive_out_of_stock } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    const [existing] = await sql`
      SELECT id FROM admin_alert_settings WHERE email = ${email}
    `;
    
    if (existing) {
      await sql`
        UPDATE admin_alert_settings 
        SET receive_low_stock = ${receive_low_stock ?? true},
            receive_critical = ${receive_critical ?? true},
            receive_out_of_stock = ${receive_out_of_stock ?? true},
            updated_at = NOW()
        WHERE email = ${email}
      `;
    } else {
      await sql`
        INSERT INTO admin_alert_settings (email, receive_low_stock, receive_critical, receive_out_of_stock)
        VALUES (${email}, ${receive_low_stock ?? true}, ${receive_critical ?? true}, ${receive_out_of_stock ?? true})
      `;
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update alert settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const sql = getDb();
    await sql`DELETE FROM admin_alert_settings WHERE email = ${email}`;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete alert setting:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
