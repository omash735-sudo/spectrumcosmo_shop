import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logAdminAction } from '@/lib/admin-audit';

// Generate TOTP secret (you'll need speakeasy or otplib)
// npm install otplib

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, code } = await req.json();
  const sql = getDb();

  if (action === 'enable') {
    // Generate secret
    const { authenticator } = await import('otplib');
    const secret = authenticator.generateSecret();
    
    // Store temporarily in session or pending_2fa table
    await sql`
      UPDATE users SET two_factor_secret = ${secret}, two_factor_pending = true WHERE id = ${user.id}
    `;
    
    const otpauth = authenticator.keyuri(user.email, 'SpectrumCosmo', secret);
    return NextResponse.json({ secret, otpauth });
  }
  
  if (action === 'verify') {
    const { authenticator } = await import('otplib');
    const [admin] = await sql`SELECT two_factor_secret FROM users WHERE id = ${user.id}`;
    
    if (!admin?.two_factor_secret) {
      return NextResponse.json({ error: '2FA not setup' }, { status: 400 });
    }
    
    const isValid = authenticator.verify({ token: code, secret: admin.two_factor_secret });
    
    if (isValid) {
      await sql`UPDATE users SET two_factor_enabled = true, two_factor_pending = false WHERE id = ${user.id}`;
      await logAdminAction(user.id, user.email, '2fa_enabled', 'admin', user.id, { success: true });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }
  
  if (action === 'disable') {
    await sql`UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = ${user.id}`;
    await logAdminAction(user.id, user.email, '2fa_disabled', 'admin', user.id);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sql = getDb();
  const [admin] = await sql`SELECT two_factor_enabled FROM users WHERE id = ${user.id}`;
  
  return NextResponse.json({ enabled: admin?.two_factor_enabled || false });
}
