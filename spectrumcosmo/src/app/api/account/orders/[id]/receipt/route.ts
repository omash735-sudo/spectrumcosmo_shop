import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { generateReceiptPDF } from '@/lib/pdf-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { id: orderId } = await params;
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const download = searchParams.get('download') === 'true';

  // Verify order belongs to user
  const [order] = await sql`
    SELECT o.*, 
           array_agg(jsonb_build_object('name', oi.product_name, 'quantity', oi.quantity, 'price', oi.unit_price_usd)) as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id::uuid
    WHERE o.id = ${orderId} AND o.user_id = ${user.id}
    GROUP BY o.id
  `;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Get receipt
  const [receipt] = await sql`
    SELECT * FROM order_receipts 
    WHERE order_id = ${orderId} 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  if (!receipt) {
    return NextResponse.json({ error: 'No receipt found for this order' }, { status: 404 });
  }

  // If download requested, generate PDF
  if (download) {
    const pdfBytes = await generateReceiptPDF(
      receipt.extracted_data,
      {
        orderNumber: order.order_number || order.id.slice(-8),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        orderDate: order.created_at,
        totalAmount: order.total_amount,
        items: order.items || [],
      }
    );

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${order.id.slice(-8)}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    receipt: {
      id: receipt.id,
      imageUrl: receipt.image_url,
      extractedData: receipt.extracted_data,
      createdAt: receipt.created_at,
    },
    order: {
      id: order.id,
      orderNumber: order.order_number || order.id.slice(-8),
      totalAmount: order.total_amount,
      status: order.status,
    },
  });
}
