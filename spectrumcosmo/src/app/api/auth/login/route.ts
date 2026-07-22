import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';
import { logSecurityEvent, isIPBlocked, recordFailedLogin } from '@/lib/security-logger';
import { getRedis } from '@/lib/redis';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

interface LoginRequest {
  email: string;
  password: string;
}

const LOGIN_CONFIG = {
  maxAttempts: 5,
  blockMinutes: 15,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify your email address - SpectrumCosmo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #C96712; margin-bottom: 20px;">Welcome to SpectrumCosmo!</h2>
        <p style="font-size: 16px; color: #333;">Hello ${name || email},</p>
        <p style="font-size: 16px; color: #333;">Please click the link below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #C96712; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">${verificationUrl}</p>
        <p style="font-size: 14px; color: #666;">This link expires in 24 hours.</p>
        <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">SpectrumCosmo - Wear your excitement with pride</p>
      </div>
    `,
  });
}

async function createEmailVerification(userId: string, email: string) {
  const sql = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await sql`DELETE FROM email_verifications WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO email_verifications (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `;

  return token;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                    req.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const isGloballyBlocked = await isIPBlocked(ipAddress);
    if (isGloballyBlocked) {
      await logSecurityEvent({
        actionType: 'blocked_ip',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 403,
        ipAddress,
        userAgent,
        details: { reason: 'IP is globally blocked' }
      });
      return NextResponse.json(
        { error: 'Access denied. Please contact support.' },
        { status: 403 }
      );
    }

    const body = await req.json() as LoginRequest;
    const { email, password } = body;

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
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const redis = getRedis();

    const rateLimitKey = `login:attempts:${ipAddress}`;
    const attempts = await redis.get<number>(rateLimitKey) || 0;

    if (attempts >= LOGIN_CONFIG.maxAttempts) {
      const ttl = await redis.ttl(rateLimitKey);
      const minutesLeft = Math.ceil(ttl / 60);

      await logSecurityEvent({
        actionType: 'rate_limited',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 429,
        ipAddress,
        userAgent,
        details: { attempts, minutesLeft }
      });

      return NextResponse.json(
        { error: `Too many failed attempts. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    const sql = getDb();
    const [user] = await sql`
      SELECT id, name, email, password_hash, account_status, email_verified
      FROM users
      WHERE email = ${email.toLowerCase()}
        AND (deleted_at IS NULL OR deleted_at > NOW())
    `;

    if (!user) {
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, LOGIN_CONFIG.blockMinutes * 60);
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

    if (user.account_status === 'frozen' || user.account_status === 'banned') {
      await logSecurityEvent({
        actionType: 'blocked_account',
        endpoint: '/api/auth/login',
        requestMethod: 'POST',
        responseStatus: 403,
        ipAddress,
        userAgent,
        userId: user.id,
        details: { status: user.account_status }
      });
      return NextResponse.json(
        { error: `Account ${user.account_status}. Please contact support.` },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, LOGIN_CONFIG.blockMinutes * 60);
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
      try {
        const token = await createEmailVerification(user.id, user.email);
        await sendVerificationEmail(user.email, user.name, token);

        await logSecurityEvent({
          actionType: 'verification_resent',
          endpoint: '/api/auth/login',
          requestMethod: 'POST',
          responseStatus: 403,
          ipAddress,
          userAgent,
          userId: user.id,
          details: { email: user.email }
        });

        return NextResponse.json(
          {
            error: 'Please verify your email before logging in. A new verification email has been sent.',
            needsVerification: true,
            email: user.email
          },
          { status: 403 }
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        await logSecurityEvent({
          actionType: 'verification_failed',
          endpoint: '/api/auth/login',
          requestMethod: 'POST',
          responseStatus: 500,
          ipAddress,
          userAgent,
          userId: user.id,
          details: { error: 'Email sending failed' }
        });
        return NextResponse.json(
          {
            error: 'Please verify your email before logging in. We could not send a verification email at this time. Please contact support.',
            needsVerification: true,
            email: user.email
          },
          { status: 403 }
        );
      }
    }

    await redis.del(rateLimitKey);

    await logSecurityEvent({
      actionType: 'successful_login',
      endpoint: '/api/auth/login',
      requestMethod: 'POST',
      responseStatus: 200,
      ipAddress,
      userAgent,
      userId: user.id,
      details: {
        email: user.email,
        duration: Date.now() - startTime
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'customer'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? 'spectrumcosmo.vercel.app' : undefined,
    });

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

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = String(num1 + num2);
  const token = crypto.randomBytes(32).toString('hex');

  const redis = getRedis();
  await redis.setex(`captcha:${token}`, 300, answer);

  return NextResponse.json({
    captchaToken: token,
    challenge: `What is ${num1} + ${num2}?`
  });
}
