import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await queryMany`
    SELECT COUNT(*) as count
    FROM notification_recipient r
    JOIN admin_notifications n ON n.id = r.notification_id
    WHERE r.customer_id = ${admin.id}::uuid
      AND r.is_read = FALSE
      AND n.status = 'sent'
  `;
  return NextResponse.json({ count: Number(result[0]?.count) || 0 });
}
