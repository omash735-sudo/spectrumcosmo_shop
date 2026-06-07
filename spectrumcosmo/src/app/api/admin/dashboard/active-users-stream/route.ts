import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ActiveUser {
  session_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  page_url: string;
  user_agent: string;
  ip_address: string;
  last_seen: Date;
  seconds_ago: number;
  device_type: string;
  browser: string;
}

export async function GET(req: NextRequest) {
  // Only admins can access this stream
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const fetchActiveUsers = async () => {
        if (isClosed) return;

        try {
          const sql = getDb();
          const result = await sql`
            SELECT 
              us.session_id,
              us.user_id,
              u.name as user_name,
              u.email as user_email,
              us.page_url,
              us.user_agent,
              us.ip_address,
              us.visited_at as last_seen,
              EXTRACT(EPOCH FROM (NOW() - us.visited_at)) as seconds_ago,
              CASE 
                WHEN us.user_agent ILIKE '%Mobile%' THEN 'Mobile'
                WHEN us.user_agent ILIKE '%Tablet%' THEN 'Tablet'
                ELSE 'Desktop'
              END as device_type,
              CASE 
                WHEN us.user_agent ILIKE '%Chrome%' THEN 'Chrome'
                WHEN us.user_agent ILIKE '%Firefox%' THEN 'Firefox'
                WHEN us.user_agent ILIKE '%Safari%' THEN 'Safari'
                WHEN us.user_agent ILIKE '%Edge%' THEN 'Edge'
                ELSE 'Other'
              END as browser
            FROM user_sessions us
            LEFT JOIN users u ON us.user_id = u.id
            WHERE us.visited_at >= NOW() - INTERVAL '15 minutes'
            ORDER BY us.visited_at DESC
            LIMIT 200
          `;

          // Cast Neon result to array
          const activeUsers = result as ActiveUser[];

          const data = {
            count: activeUsers.length,
            users: activeUsers,
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('SSE fetch error:', err);
          if (!isClosed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to fetch active users' })}\n\n`));
          }
        }
      };

      // Initial fetch
      await fetchActiveUsers();

      // Schedule periodic updates (every 10 seconds)
      interval = setInterval(fetchActiveUsers, 10000);

      // Handle client disconnect
      const cleanup = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        isClosed = true;
      };

      // Override close method
      const originalClose = controller.close.bind(controller);
      controller.close = () => {
        cleanup();
        originalClose();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
