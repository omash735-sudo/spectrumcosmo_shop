import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signUserToken } from '@/lib/userAuth';
import { recordFailedLogin, logSecurityEvent, isIPBlocked } from '@/lib/security-logger';

async function ensureUsersTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      newsletter_subscribed BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  try {
    // Get IP address and user agent for security logging
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check if IP is blocked
    const isBlocked = await isIPBlocked(ipAddress);
    if (isBlocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 403 }
      );
    }

    await ensureUsersTable();
    
    const { email, password } = await req.json();
    
    // Validate input
    if (!email || !password) {
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 400,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: { error: 'Missing credentials' }
      });
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const sql = getDb();
    const users = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email}`;
    
    // Failed login - user not found
    if (users.length === 0) {
      await recordFailedLogin(email, ipAddress);
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 401,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: { email, reason: 'User not found' }
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    // Failed login - wrong password
    if (!passwordValid) {
      await recordFailedLogin(email, ipAddress);
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 401,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: { email, reason: 'Invalid password', userId: user.id }
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login
    const token = signUserToken({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: 'customer' 
    });
    
    await logSecurityEvent({
      actionType: 'successful_login',
      endpoint: '/api/auth/login',
      requestMethod: 'POST',
      responseStatus: 200,
      ipAddress: ipAddress,
      userAgent: userAgent,
      userId: user.id,
      details: { email: user.email }
    });
    
    const res = NextResponse.json({ 
      user: { id: user.id, name: user.name, email: user.email } 
    });
    
    res.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    await logSecurityEvent({
      actionType: 'login_error',
      endpoint: '/api/auth/login',
      requestMethod: 'POST',
      responseStatus: 500,
      ipAddress: ipAddress,
      userAgent: userAgent,
      details: { error: err.message }
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
