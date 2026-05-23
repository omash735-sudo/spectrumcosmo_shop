import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, token } = await req.json();
    const sql = getDb();

    if (action === 'generate') {
      // Generate new secret
      const secret = authenticator.generateSecret();
      
      // Store temporarily
      await sql`
        UPDATE users 
        SET two_factor_secret = ${secret}, two_factor_enabled = false 
        WHERE id = ${user.id}
      `;
      
      // Generate QR code URL
      const otpauth = authenticator.keyuri(user.email, 'SpectrumCosmo', secret);
      const qrCode = await QRCode.toDataURL(otpauth);
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      
      // Store backup codes (hashed in production)
      await sql`
        UPDATE users SET two_factor_backup_codes = ${JSON.stringify(backupCodes)} 
        WHERE id = ${user.id}
      `;
      
      return NextResponse.json({ 
        secret, 
        qrCode, 
        backupCodes 
      });
    }
    
    if (action === 'verify') {
      const [admin] = await sql`
        SELECT two_factor_secret FROM users WHERE id = ${user.id}
      `;
      
      if (!admin?.two_factor_secret) {
        return NextResponse.json({ error: '2FA not initialized' }, { status: 400 });
      }
      
      const isValid = authenticator.verify({
        token,
        secret: admin.two_factor_secret
      });
      
      if (isValid) {
        await sql`
          UPDATE users 
          SET two_factor_enabled = true 
          WHERE id = ${user.id}
        `;
        
        // Log the action
        await sql`
          INSERT INTO security_logs (user_id, action_type, ip_address, details, created_at)
          VALUES (${user.id}, 'admin_2fa_enabled', ${req.headers.get('x-forwarded-for') || 'unknown'}, ${JSON.stringify({ success: true })}, NOW())
        `;
        
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
    
    if (action === 'disable') {
      const [admin] = await sql`
        SELECT two_factor_enabled FROM users WHERE id = ${user.id}
      `;
      
      if (!admin?.two_factor_enabled) {
        return NextResponse.json({ error: '2FA not enabled' }, { status: 400 });
      }
      
      await sql`
        UPDATE users 
        SET two_factor_enabled = false, two_factor_secret = NULL, two_factor_backup_codes = NULL 
        WHERE id = ${user.id}
      `;
      
      await sql`
        INSERT INTO security_logs (user_id, action_type, ip_address, details, created_at)
        VALUES (${user.id}, 'admin_2fa_disabled', ${req.headers.get('x-forwarded-for') || 'unknown'}, ${JSON.stringify({})}, NOW())
      `;
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('2FA error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sql = getDb();
  const [admin] = await sql`
    SELECT two_factor_enabled FROM users WHERE id = ${user.id}
  `;
  
  return NextResponse.json({ enabled: admin?.two_factor_enabled || false });
}
