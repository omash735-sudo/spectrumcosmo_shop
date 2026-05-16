import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signUserToken } from '@/lib/userAuth';
import { recordFailedLogin, logSecurityEvent, isIPBlocked } from '@/lib/security-logger';

// In-memory store for login attempts (use Redis in production)
const loginAttemptStore = new Map<string, { attempts: number; firstAttempt: number; blockedUntil: number }>();

// Rule 1: Login Protection Configuration
const LOGIN_RULE = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
};

// Helper: Clean up expired login attempts
function cleanupLoginAttempts() {
  const now = Date.now();
  for (const [key, value] of loginAttemptStore) {
    if (value.blockedUntil && now > value.blockedUntil) {
      loginAttemptStore.delete(key);
    } else if (now > value.firstAttempt + LOGIN_RULE.windowMs) {
      loginAttemptStore.delete(key);
    }
  }
}
setInterval(cleanupLoginAttempts, 60 * 1000);

// Rule 9: Check if CAPTCHA is required
function shouldRequireCaptcha(ipAddress: string): boolean {
  const attempts = loginAttemptStore.get(`attempts:${ipAddress}`);
  if (!attempts) return false;
  // Require CAPTCHA after 3 failed attempts
  return attempts.attempts >= 3;
}

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

    // Rule 1: Check if IP is blocked due to too many failed attempts
    const isBlocked = await isIPBlocked(ipAddress);
    if (isBlocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 403 }
      );
    }

    // Rule 1: Check in-memory block
    const blockKey = `blocked:${ipAddress}`;
    const blockData = loginAttemptStore.get(blockKey);
    if (blockData && blockData.blockedUntil && Date.now() < blockData.blockedUntil) {
      const minutesLeft = Math.ceil((blockData.blockedUntil - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Please try again in ${minutesLeft} minutes.` },
        { status: 403 }
      );
    }

    await ensureUsersTable();
    
    const { email, password, captchaToken, captchaAnswer } = await req.json();
    
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

    // Rule 9: CAPTCHA verification for suspicious attempts
    const needsCaptcha = shouldRequireCaptcha(ipAddress);
    if (needsCaptcha) {
      if (!captchaToken && !captchaAnswer) {
        return NextResponse.json(
          { error: 'CAPTCHA required', requiresCaptcha: true },
          { status: 428 }
        );
      }
      
      // Verify CAPTCHA (simple example - replace with proper CAPTCHA service)
      const isCaptchaValid = await verifyCaptcha(captchaToken, captchaAnswer);
      if (!isCaptchaValid) {
        await logSecurityEvent({
          actionType: 'failed_captcha',
          endpoint: '/api/auth/login',
          requestMethod: 'POST',
          responseStatus: 400,
          ipAddress: ipAddress,
          userAgent: userAgent,
          details: { email, reason: 'Invalid CAPTCHA' }
        });
        return NextResponse.json(
          { error: 'Invalid CAPTCHA. Please try again.', requiresCaptcha: true },
          { status: 400 }
        );
      }
    }

    const sql = getDb();
    const users = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email}`;
    
    // Track attempts for this IP
    const attemptKey = `attempts:${ipAddress}`;
    const currentAttempts = loginAttemptStore.get(attemptKey) || { attempts: 0, firstAttempt: Date.now(), blockedUntil: null };
    
    // Failed login - user not found
    if (users.length === 0) {
      // Increment attempt counter
      const newAttempts = currentAttempts.attempts + 1;
      let blockedUntil = null;
      
      // Rule 1: Block after 5 attempts
      if (newAttempts >= LOGIN_RULE.maxAttempts) {
        blockedUntil = Date.now() + LOGIN_RULE.blockDurationMs;
        loginAttemptStore.set(`blocked:${ipAddress}`, { attempts: 0, firstAttempt: Date.now(), blockedUntil });
        await recordFailedLogin(email, ipAddress);
      }
      
      loginAttemptStore.set(attemptKey, {
        attempts: newAttempts,
        firstAttempt: currentAttempts.firstAttempt,
        blockedUntil,
      });
      
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 401,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: { email, reason: 'User not found', attempts_remaining: LOGIN_RULE.maxAttempts - newAttempts }
      });
      
      // Rule 9: Tell client if CAPTCHA is now required
      const nowRequiresCaptcha = newAttempts >= 3;
      return NextResponse.json(
        { error: 'Invalid credentials', requiresCaptcha: nowRequiresCaptcha },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    // Failed login - wrong password
    if (!passwordValid) {
      // Increment attempt counter
      const newAttempts = currentAttempts.attempts + 1;
      let blockedUntil = null;
      
      // Rule 1: Block after 5 attempts
      if (newAttempts >= LOGIN_RULE.maxAttempts) {
        blockedUntil = Date.now() + LOGIN_RULE.blockDurationMs;
        loginAttemptStore.set(`blocked:${ipAddress}`, { attempts: 0, firstAttempt: Date.now(), blockedUntil });
        await recordFailedLogin(email, ipAddress);
      }
      
      loginAttemptStore.set(attemptKey, {
        attempts: newAttempts,
        firstAttempt: currentAttempts.firstAttempt,
        blockedUntil,
      });
      
      await recordFailedLogin(email, ipAddress);
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 401,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: { email, reason: 'Invalid password', userId: user.id, attempts_remaining: LOGIN_RULE.maxAttempts - newAttempts }
      });
      
      // Rule 9: Tell client if CAPTCHA is now required
      const nowRequiresCaptcha = newAttempts >= 3;
      return NextResponse.json(
        { error: 'Invalid credentials', requiresCaptcha: nowRequiresCaptcha },
        { status: 401 }
      );
    }

    // Successful login - reset attempt counter
    loginAttemptStore.delete(attemptKey);
    loginAttemptStore.delete(`blocked:${ipAddress}`);

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

// =============================================
// CAPTCHA Verification (Rule 9)
// =============================================
// Simple CAPTCHA store - use proper service in production
const captchaStore = new Map<string, { answer: string; expires: number }>();

// Generate CAPTCHA challenge
export async function generateCaptcha(ipAddress: string): Promise<{ token: string; challenge: string }> {
  // Simple math challenge (in production, use Google reCAPTCHA or similar)
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = String(num1 + num2);
  const token = Buffer.from(`${ipAddress}:${Date.now()}:${Math.random()}`).toString('base64');
  
  captchaStore.set(token, {
    answer,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
  });
  
  // Clean up expired CAPTCHAs
  setTimeout(() => captchaStore.delete(token), 5 * 60 * 1000);
  
  return {
    token,
    challenge: `What is ${num1} + ${num2}?`,
  };
}

async function verifyCaptcha(token: string, answer: string): Promise<boolean> {
  const captcha = captchaStore.get(token);
  if (!captcha) return false;
  if (Date.now() > captcha.expires) return false;
  return captcha.answer === answer;
}

// API endpoint to request CAPTCHA (call this from frontend when needsCaptcha is true)
export async function GET(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { token, challenge } = await generateCaptcha(ipAddress);
  return NextResponse.json({ token, challenge });
}
