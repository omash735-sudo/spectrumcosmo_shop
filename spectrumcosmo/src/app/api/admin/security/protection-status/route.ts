import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);
  
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
