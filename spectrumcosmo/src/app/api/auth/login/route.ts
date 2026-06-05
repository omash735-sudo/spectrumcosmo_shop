// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signUserToken } from '@/lib/userAuth';
import { recordFailedLogin, logSecurityEvent, isIPBlocked } from '@/lib/security-logger';
import { setCsrfToken } from '@/lib/csrf';
import { Redis } from '@upstash/redis';

// Types
interface LoginAttempt {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

interface CaptchaRecord {
  answer: string;
  expires: number;
}

interface LoginRequest {
  email: string;
  password: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

// Configuration
const LOGIN_CONFIG = {
  maxAttempts: 5,
  windowMinutes: 10,
  blockMinutes: 15,
  captchaThreshold: 3,
  cleanupIntervalMs: 5 * 60 * 1000,
};

const redis = Redis.fromEnv();

// In-memory stores with size limits
const loginAttemptStore = new Map<string, LoginAttempt>();
const captchaStore = new Map<string, CaptchaRecord>();
const MAX_STORE_SIZE = 10000;

function cleanupStores() {
  const now = Date.now();
  
  if (loginAttemptStore.size > MAX_STORE_SIZE) {
    const toDelete = Array.from(loginAttemptStore.entries())
      .filter(([_, value]) => now > (value.firstAttempt + LOGIN_CONFIG.windowMinutes * 60 * 1000));
    for (const [key] of toDelete) {
      loginAttemptStore.delete(key);
    }
  }
  
  if (captchaStore.size > MAX_STORE_SIZE) {
    const toDelete = Array.from(captchaStore.entries())
      .filter(([_, value]) => now > value.expires);
    for (const [key] of toDelete) {
      captchaStore.delete(key);
    }
  }
}

setInterval(cleanupStores, LOGIN_CONFIG.cleanupIntervalMs);

function getAttempts(ip: string): LoginAttempt {
  return loginAttemptStore.get(`attempts:${ip}`) || { attempts: 0, firstAttempt: Date.now(), blockedUntil: null };
}

function incrementAttempts(ip: string): { attempts: number; isBlocked: boolean; blockedUntil: number | null } {
  const current = getAttempts(ip);
  const newAttempts = current.attempts + 1;
  let blockedUntil = current.blockedUntil;
  
  if (newAttempts >= LOGIN_CONFIG.maxAttempts && !blockedUntil) {
    blockedUntil = Date.now() + LOGIN_CONFIG.blockMinutes * 60 * 1000;
  }
  
  loginAttemptStore.set(`attempts:${ip}`, {
    attempts: newAttempts,
    firstAttempt: current.firstAttempt,
    blockedUntil,
  });
  
  return { attempts: newAttempts, isBlocked: !!blockedUntil && Date.now() < blockedUntil, blockedUntil };
}

function resetAttempts(ip: string): void {
  loginAttemptStore.delete(`attempts:${ip}`);
  loginAttemptStore.delete(`blocked:${ip}`);
}

function isIpTemporarilyBlocked(ip: string): number | null {
  const blocked = loginAttemptStore.get(`blocked:${ip}`);
  if (blocked?.blockedUntil && Date.now() < blocked.blockedUntil) {
    return Math.ceil((blocked.blockedUntil - Date.now()) / 60000);
  }
  return null;
}

function shouldRequireCaptcha(ip: string): boolean {
  const attempts = getAttempts(ip);
  return attempts.attempts >= LOGIN_CONFIG.captchaThreshold;
}

async function generateCaptcha(ip: string): Promise<{ token: string; challenge: string }> {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = String(num1 + num2);
  const token = Buffer.from(`${ip}:${Date.now()}:${Math.random()}`).toString('base64').slice(0, 64);
  
  captchaStore.set(token, {
    answer,
    expires: Date.now() + 5 * 60 * 1000,
  });
  
  return {
    token,
    challenge: `What is ${num1} + ${num2}?`,
  };
}

async function verifyCaptcha(token: string, answer: string): Promise<boolean> {
  const captcha = captchaStore.get(token);
  if (!captcha) return false;
  if (Date.now() > captcha.expires) {
    captchaStore.delete(token);
    return false;
  }
  captchaStore.delete(token);
  return captcha.answer === answer;
}

async function ensureUsersTable(): Promise<void> {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      newsletter_subscribed BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret TEXT,
      account_status TEXT DEFAULT 'active',
      email_verified BOOLEAN DEFAULT false,
      email_verified_at TIMESTAMP
    )
  `;
}

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const blockedMinutes = isIpTemporarilyBlocked(ipAddress);
    if (blockedMinutes) {
      return NextResponse.json(
        { error: `Too many failed attempts. Please try again in ${blockedMinutes} minutes.` },
        { status: 429 }
      );
    }

    const isGloballyBlocked = await isIPBlocked(ipAddress);
    if (isGloballyBlocked) {
      return NextResponse.json(
        { error: 'Access denied. Please contact support.' },
        { status: 403 }
      );
    }

    await ensureUsersTable();
    
    const body = await req.json() as LoginRequest;
    const { email, password, captchaToken, captchaAnswer } = body;
    
    if (!email || !password) {
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 400,
        ipAddress,
        userAgent,
        details: { reason: 'Missing credentials' }
      });
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const needsCaptcha = shouldRequireCaptcha(ipAddress);
    if (needsCaptcha) {
      if (!captchaToken || !captchaAnswer) {
        const { token, challenge } = await generateCaptcha(ipAddress);
        return NextResponse.json(
          { error: 'CAPTCHA required', requiresCaptcha: true, captchaToken: token, captchaChallenge: challenge },
          { status: 428 }
        );
      }
      
      const isCaptchaValid = await verifyCaptcha(captchaToken, captchaAnswer);
      if (!isCaptchaValid) {
        await logSecurityEvent({
          actionType: 'failed_captcha',
          endpoint: '/api/auth/login',
          requestMethod: 'POST',
          responseStatus: 400,
          ipAddress,
          userAgent,
          details: { email }
        });
        const { token, challenge } = await generateCaptcha(ipAddress);
        return NextResponse.json(
          { error: 'Invalid CAPTCHA. Please try again.', requiresCaptcha: true, captchaToken: token, captchaChallenge: challenge },
          { status: 400 }
        );
      }
    }

    const sql = getDb();
    const [user] = await sql`
      SELECT id, name, email, password_hash, account_status, email_verified 
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `;

    if (!user) {
      const { attempts } = incrementAttempts(ipAddress);
      await recordFailedLogin(email, ipAddress);
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 401,
        ipAddress,
        userAgent,
        details: { email, reason: 'User not found' }
      });
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.account_status === 'frozen') {
      return NextResponse.json({ error: 'Account frozen. Please contact support.' }, { status: 403 });
    }
    
    if (user.account_status === 'banned') {
      return NextResponse.json({ error: 'Account banned. Please contact support.' }, { status: 403 });
    }
    
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      const { attempts } = incrementAttempts(ipAddress);
      await recordFailedLogin(email, ipAddress);
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 401,
        ipAddress,
        userAgent,
        userId: user.id,
        details: { email, reason: 'Invalid password' }
      });
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.email_verified) {
      await logSecurityEvent({
        actionType: 'failed_login',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 403,
        ipAddress,
        userAgent,
        userId: user.id,
        details: { email, reason: 'Email not verified' }
      });
      
      return NextResponse.json(
        { error: 'Please verify your email before logging in', needsVerification: true, email: user.email },
        { status: 403 }
      );
    }

    // Blacklist existing token
    const existingToken = req.cookies.get('user_token')?.value;
    if (existingToken) {
      await redis.setex(`blacklist:${existingToken}`, 86400, 'logged_out');
    }

    resetAttempts(ipAddress);

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
      ipAddress,
      userAgent,
      userId: user.id,
      details: { email: user.email }
    });
    
    const response = NextResponse.json({ 
      user: { id: user.id, name: user.name, email: user.email } 
    });
    
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    setCsrfToken(response, user.id);
    
    return response;
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Login error:', errorMessage);
    
    await logSecurityEvent({
      actionType: 'login_error',
      endpoint: '/api/auth/login',
      requestMethod: 'POST',
      responseStatus: 500,
      ipAddress,
      userAgent,
      details: { error: errorMessage }
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { token, challenge } = await generateCaptcha(ipAddress);
  return NextResponse.json({ captchaToken: token, captchaChallenge: challenge });
}
