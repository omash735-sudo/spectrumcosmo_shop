import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'today';

  try {
    let data;
    
    if (period === 'today') {
      // Hourly data for today
      data = await queryMany`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(DISTINCT user_id) as unique_visitors
        FROM orders 
        WHERE created_at >= CURRENT_DATE
          AND status NOT IN ('cancelled', 'declined')
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour ASC
      `;
      
      // Format with all 24 hours
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        const found = data.find((d: any) => Number(d.hour) === i);
        hourlyData.push({
          hour: `${i.toString().padStart(2, '0')}:00`,
          orders: Number(found?.orders || 0),
          revenue: Number(found?.revenue || 0),
          views: Math.floor(Math.random() * 500) + 100, // Replace with actual page_views
        });
      }
      data = hourlyData;
    } else if (period === 'week') {
      // Daily data for last 7 days
      data = await queryMany`
        SELECT 
          DATE(created_at) as day,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(DISTINCT user_id) as unique_visitors
        FROM orders 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND status NOT IN ('cancelled', 'declined')
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `;
    } else {
      // Monthly data for last 30 days
      data = await queryMany`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(DISTINCT user_id) as unique_visitors
        FROM orders 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND status NOT IN ('cancelled', 'declined')
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC
      `;
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('Revenue graph error:', err);
    return NextResponse.json([]);
  }
}
