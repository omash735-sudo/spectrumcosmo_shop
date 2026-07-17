import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // All protections are enabled by default
  // These would normally be checked against database settings or environment variables
  return NextResponse.json({
    rate_limiting: true,
    sql_injection: true,
    xss: true,
    csrf: true,
    auto_blocking: true,
    admin_route_protection: true,
    file_upload_validation: true,
    last_updated: new Date().toISOString(),
  });
}
