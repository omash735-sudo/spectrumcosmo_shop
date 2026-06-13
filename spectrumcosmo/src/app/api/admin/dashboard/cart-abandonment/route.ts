import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    // If you have a carts table, use it. If not, estimate from sessions.
    // Check if carts table exists
    let cartData;
    try {
      cartData = await queryMany`
        SELECT 
          COUNT(*) as total_carts,
          COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_carts,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_carts
        FROM carts 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;
    } catch {
      // If no carts table, use orders + sessions as proxy
      const [sessionData] = await queryMany`
        SELECT COUNT(DISTINCT session_id) as total_sessions
        FROM user_sessions 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;
      
      const [orderData] = await queryMany`
        SELECT COUNT(*) as completed_orders
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND status NOT IN ('cancelled', 'declined')
      `;
      
      const totalSessions = Number(sessionData?.total_sessions || 0);
      const completedOrders = Number(orderData?.completed_orders || 0);
      const abandoned = Math.max(0, totalSessions - completedOrders);
      
      return NextResponse.json({
        abandonment_rate: totalSessions > 0 ? ((abandoned / totalSessions) * 100).toFixed(1) : 0,
        abandoned_carts: abandoned,
        total_carts: totalSessions,
        completed_carts: completedOrders,
        data_source: 'sessions_proxy',
      });
    }

    const totalCarts = Number(cartData?.[0]?.total_carts || 0);
    const abandonedCarts = Number(cartData?.[0]?.abandoned_carts || 0);
    const abandonmentRate = totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0;

    return NextResponse.json({
      abandonment_rate: abandonmentRate.toFixed(1),
      abandoned_carts: abandonedCarts,
      total_carts: totalCarts,
      completed_carts: Number(cartData?.[0]?.completed_carts || 0),
      data_source: 'carts_table',
    });
  } catch (err) {
    console.error('Cart abandonment error:', err);
    return NextResponse.json({
      abandonment_rate: 0,
      abandoned_carts: 0,
      total_carts: 0,
      completed_carts: 0,
    });
  }
}
