// src/app/api/admin/quote-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  try {
    const sql = getDb();

    const quotes = await queryMany`
      SELECT 
        qr.id,
        qr.order_id,
        qr.customer_name,
        qr.customer_email,
        qr.customer_phone,
        qr.delivery_location,
        qr.requested_method,
        qr.admin_quote_fee,
        qr.admin_quote_notes,
        qr.status,
        qr.created_at,
        o.total_amount
      FROM quote_requests qr
      LEFT JOIN orders o ON qr.order_id = o.id
      WHERE qr.status = ${status}
      ORDER BY qr.created_at DESC
    `;

    return NextResponse.json(quotes);
  } catch (err) {
    console.error('Error fetching quote requests:', err);
    return NextResponse.json(
      { error: 'Failed to load quote requests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      order_id, 
      customer_name, 
      customer_email, 
      customer_phone, 
      delivery_location,
      requested_method 
    } = body;

    const sql = getDb();

    const result = await sql`
      INSERT INTO quote_requests (
        order_id,
        customer_name,
        customer_email,
        customer_phone,
        delivery_location,
        requested_method,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${order_id}::uuid,
        ${customer_name},
        ${customer_email},
        ${customer_phone},
        ${delivery_location},
        ${requested_method || 'Standard Delivery'},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    console.error('Error creating quote request:', err);
    return NextResponse.json(
      { error: 'Failed to create quote request' },
      { status: 500 }
    );
  }
}
