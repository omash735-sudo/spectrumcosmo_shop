import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }
  
  try {
    const sql = getDb();
    
    const [verification] = await sql`
      SELECT * FROM email_verifications WHERE token = ${token} AND expires_at > NOW()
    `;
    
    if (!verification) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    
    // Update user
    await sql`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW() 
      WHERE id = ${verification.user_id}
    `;
    
    // Delete used token
    await sql`
      DELETE FROM email_verifications WHERE token = ${token}
    `;
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`);
  } catch (err: any) {
    console.error('Verify email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
