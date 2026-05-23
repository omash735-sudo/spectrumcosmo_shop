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
    
    // Find the verification token
    const [verification] = await sql`
      SELECT user_id, expires_at FROM email_verifications WHERE token = ${token}
    `;
    
    if (!verification) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_token`
      );
    }
    
    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=expired_token`
      );
    }
    
    // Update user as verified
    await sql`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW() 
      WHERE id = ${verification.user_id}
    `;
    
    // Delete the used token
    await sql`DELETE FROM email_verifications WHERE token = ${token}`;
    
    // Redirect to login with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`
    );
  } catch (err: any) {
    console.error('Verify email error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=server_error`
    );
  }
}
