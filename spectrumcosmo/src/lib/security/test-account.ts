// lib/security/test-account.ts
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getRedisClient } from './redis-client';

const CACHE_TTL = 60;

async function getTestAccountEnabled(): Promise<boolean> {
  const redis = getRedisClient();
  const cached = await redis.get('test_account_enabled');
  
  if (cached !== null) {
    return cached === 'true';
  }
  
  const sql = getDb();
  try {
    const [setting] = await sql`
      SELECT value FROM site_settings WHERE key = 'test_account_enabled'
    `;
    const enabled = setting?.value === 'true';
    await redis.setex('test_account_enabled', CACHE_TTL, enabled ? 'true' : 'false');
    return enabled;
  } catch {
    return true;
  }
}

export async function isTestAccountWriteBlocked(request: NextRequest): Promise<boolean> {
  const userToken = request.cookies.get('user_token')?.value;
  if (!userToken) return false;
  
  try {
    const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
    const userId = payload.userId || payload.id;
    
    if (!userId) return false;
    
    const sql = getDb();
    const [user] = await sql`
      SELECT is_test_account FROM users WHERE id = ${userId}
    `;
    
    if (!user?.is_test_account) return false;
    
    const testAccountEnabled = await getTestAccountEnabled();
    return !testAccountEnabled;
  } catch {
    return false;
  }
}
