import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let interval: NodeJS.Timeout;
      let isClosed = false;
      
      const fetchActiveUsers = async () => {
        if (isClosed) return;
        
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
            LIMIT 50
          `;
          
          const data = { 
            count: activeUsers.length, 
            users: activeUsers, 
            timestamp: new Date().toISOString() 
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('SSE error:', err);
          if (!isClosed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to fetch' })}\n\n`));
          }
        }
      };
      
      await fetchActiveUsers();
      interval = setInterval(fetchActiveUsers, 10000); // 10 seconds instead of 5
      
      // Clean up
      const originalClose = controller.close.bind(controller);
      controller.close = () => {
        isClosed = true;
        clearInterval(interval);
        originalClose();
      };
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
