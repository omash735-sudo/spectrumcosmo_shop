import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getRedis } from '@/lib/redis';
import { logSecurityEvent } from '@/lib/security-logger';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const RATE_LIMIT_MAX = 10; // 10 requests per minute

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Validate email presence
    if (!email) {
      await logSecurityEvent({
        actionType: 'check_email_failed',
        endpoint: '/api/auth/check-email',
        requestMethod: 'GET',
        responseStatus: 400,
        ipAddress,
        userAgent,
        details: { reason: 'Email is required' }
      });
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await logSecurityEvent({
        actionType: 'check_email_failed',
        endpoint: '/api/auth/check-email',
        requestMethod: 'GET',
        responseStatus: 400,
        ipAddress,
        userAgent,
        details: { email, reason: 'Invalid email format' }
      });
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting using Redis (matching your existing approach)
    const redis = getRedis();
    const rateLimitKey = `check-email:${ipAddress}`;
    const attempts = await redis.get<number>(rateLimitKey) || 0;

    if (attempts >= RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(rateLimitKey);
      const secondsLeft = Math.ceil(ttl);

      await logSecurityEvent({
        actionType: 'rate_limited',
        endpoint: '/api/auth/check-email',
        requestMethod: 'GET',
        responseStatus: 429,
        ipAddress,
        userAgent,
        details: { 
          endpoint: 'check-email',
          attempts,
          secondsLeft 
        }
      });

      return NextResponse.json(
        { 
          error: `Too many requests. Please try again in ${secondsLeft} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(secondsLeft),
          },
        }
      );
    }

    // Increment rate limit counter
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);

    // Check if user exists in database
    const sql = getDb();
    const [user] = await sql`
      SELECT id
      FROM users
      WHERE email = ${email.toLowerCase()}
        AND (deleted_at IS NULL OR deleted_at > NOW())
      LIMIT 1
    `;

    // Log the check (without revealing account existence to the log)
    await logSecurityEvent({
      actionType: 'check_email_success',
      endpoint: '/api/auth/check-email',
      requestMethod: 'GET',
      responseStatus: 200,
      ipAddress,
      userAgent,
      details: {
        email,
        exists: !!user,
        duration: Date.now() - startTime
      }
    });

    // Return ONLY whether the email exists - no other information
    return NextResponse.json({
      exists: !!user,
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Check email error:', errorMessage);

    await logSecurityEvent({
      actionType: 'check_email_error',
      endpoint: '/api/auth/check-email',
      requestMethod: 'GET',
      responseStatus: 500,
      ipAddress,
      userAgent,
      details: { error: errorMessage }
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
