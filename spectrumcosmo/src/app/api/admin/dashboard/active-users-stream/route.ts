import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ActiveUser {
  session_id: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  page_url: string;
  user_agent: string;
  ip_address: string;
  last_seen: string;
  seconds_ago: number;
  device_type: string;
  browser: string;
}

export async function GET() {
  const encoder = new TextEncoder();
  
  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      let interval: NodeJS.Timeout;
      
      const fetchActiveUsers = async () => {
        try {
          const sql = getDb();
          
          const activeUsers = await sql`
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
          `;
          
          const count = activeUsers.length;
          const data = { count, users: activeUsers, timestamp: new Date().toISOString() };
          
          // Send as SSE event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('SSE error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to fetch' })}\n\n`));
        }
      };
      
      // Send immediately, then every 5 seconds
      await fetchActiveUsers();
      interval = setInterval(fetchActiveUsers, 5000);
      
      // Clean up on close
      controller.enqueue = new Proxy(controller.enqueue, {
        apply(target, thisArg, args) {
          clearInterval(interval);
          return Reflect.apply(target, thisArg, args);
        }
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
