// app/api/orders/[orderId]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    // Get order with payment info
    const order = await queryOne<{
      id: string;
      customer_name: string;
      customer_email: string;
      phone_number: string;
      total_amount: number;
      currency: string;
      payment_status: string;
      payment_method: string;
      payment_provider_id: string | null;
      proof_of_payment_url: string | null;
      payment_note: string | null;
      provider_name: string | null;
      provider_type: string | null;
      provider_category: string | null;
      account_name: string | null;
      account_number: string | null;
      branch: string | null;
      instructions: string | null;
    }>`
      SELECT 
        o.id::text,
        o.customer_name,
        o.customer_email,
        o.phone_number,
        o.total_amount,
        o.currency,
        o.payment_status,
        o.payment_method,
        o.payment_provider_id,
        o.proof_of_payment_url,
        o.payment_note,
        p.name as provider_name,
        p.type as provider_type,
        p.category as provider_category,
        p.account_name,
        p.account_number,
        p.branch,
        p.instructions
      FROM orders o
      LEFT JOIN payment_providers p ON p.id = o.payment_provider_id
      WHERE o.id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get payment confirmations - use any[] to avoid type mismatch
    let confirmations: any[] = [];
    try {
      confirmations = await queryAsArray`
        SELECT * FROM payment_confirmation
        WHERE order_id = ${orderId}
        ORDER BY submitted_at DESC
      `;
    } catch (err) {
      // Table might not exist or other error - continue without confirmations
      console.log('Payment confirmations error:', err);
    }

    // Get order items
    const items = await queryAsArray<{
      id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      custom_details: string | null;
    }>`
      SELECT 
        id,
        product_name,
        quantity,
        unit_price_usd as unit_price,
        subtotal_usd as subtotal,
        custom_details
      FROM order_items
      WHERE order_id::text = ${orderId}
    `;

    // Get additional order details
    const orderDetails = await queryOne<{
      subtotal: number;
      shipping_cost: number;
      discount_amount: number;
      promo_code: string | null;
      promo_discount: number | null;
      referral_code: string | null;
      created_at: string;
      expires_at: string;
      delivery_quote_status: string | null;
      quoted_delivery_fee: number | null;
      status: string;
      delivery_method: string | null;
    }>`
      SELECT 
        subtotal,
        shipping_cost,
        discount_amount,
        promo_code,
        promo_discount,
        referral_code,
        created_at,
        expires_at,
        delivery_quote_status,
        quoted_delivery_fee,
        status,
        delivery_method
      FROM orders
      WHERE id::text = ${orderId}
    `;

    const displayCurrency = order.currency || 'MWK';

    return NextResponse.json({
      order: {
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.phone_number,
        total_amount: order.total_amount,
        subtotal: orderDetails?.subtotal || 0,
        shipping_cost: orderDetails?.shipping_cost || 0,
        discount_amount: orderDetails?.discount_amount || 0,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        status: orderDetails?.status || 'pending',
        promo_code: orderDetails?.promo_code || null,
        promo_discount: orderDetails?.promo_discount || null,
        referral_code: orderDetails?.referral_code || null,
        created_at: orderDetails?.created_at || new Date().toISOString(),
        expires_at: orderDetails?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        delivery_quote_status: orderDetails?.delivery_quote_status || null,
        quoted_delivery_fee: orderDetails?.quoted_delivery_fee || null,
        delivery_method: orderDetails?.delivery_method || null,
        currency: displayCurrency,
        display_amount: order.total_amount,
        receiving_currency: 'MWK',
        receiving_amount: order.total_amount,
      },
      provider: order.provider_name ? {
        name: order.provider_name,
        type: order.provider_type,
        category: order.provider_category,
        account_name: order.account_name,
        account_number: order.account_number,
        branch: order.branch,
        instructions: order.instructions,
        logo_url: null,
      } : null,
      existing_proof: order.proof_of_payment_url,
      existing_note: order.payment_note,
      existing_transaction_ref: null,
      items: items.map(item => ({
        id: String(item.id),
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.subtotal,
        image_url: '',
        custom_details: item.custom_details,
      })),
      confirmations,
    });
  } catch (err) {
    console.error('Payment status error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
