import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const loginActivities = await queryMany`
      SELECT 
        endpoint,
        method,
        status,
        response_time_ms,
        created_at as timestamp,
        ip_address,
        user_agent
      FROM api_logs 
      WHERE endpoint = '/api/auth/login'
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    
    return NextResponse.json(loginActivities);
  } catch (err) {
    console.error('Login activity error:', err);
    return NextResponse.json([]);
  }
}
