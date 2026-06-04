import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { generateReceiptPDF } from '@/lib/pdf-generator';

// Types
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_email: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
}

interface Receipt {
  id: string;
  image_url: string;
  extracted_data: any;
  created_at: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getVerifiedUser(req);
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    // Verify order belongs to user
    const orders = await sql`
      SELECT o.*, 
             COALESCE(
               jsonb_agg(
                 jsonb_build_object(
                   'name', oi.product_name, 
                   'quantity', oi.quantity, 
                   'price', oi.unit_price_usd
                 )
               ) FILTER (WHERE oi.id IS NOT NULL),
               '[]'::jsonb
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id::uuid
      WHERE o.id = ${orderId} AND o.user_id = ${user.id}
      GROUP BY o.id
    `;

    const order = orders[0] as Order | undefined;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get receipt
    const receipts = await sql`
      SELECT * FROM order_receipts 
      WHERE order_id = ${orderId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const receipt = receipts[0] as Receipt | undefined;

    if (!receipt) {
      return NextResponse.json({ error: 'No receipt found for this order' }, { status: 404 });
    }

    // If download requested, generate PDF
    if (download) {
      try {
        const pdfBytes = await generateReceiptPDF(
          receipt.extracted_data || {},
          {
            orderNumber: order.order_number || order.id.slice(-8).toUpperCase(),
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            orderDate: order.created_at,
            totalAmount: order.total_amount,
            items: order.items || [],
          }
        );

        // FIX: Convert Uint8Array to Buffer for compatibility
        let buffer: Buffer;
        if (pdfBytes instanceof Uint8Array) {
          buffer = Buffer.from(pdfBytes);
        } else if (Buffer.isBuffer(pdfBytes)) {
          buffer = pdfBytes;
        } else if (typeof pdfBytes === 'string') {
          buffer = Buffer.from(pdfBytes);
        } else {
          throw new Error('Invalid PDF format returned from generator');
        }

        // Use Response constructor instead of NextResponse for binary data
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="receipt-${order.id.slice(-8).toUpperCase()}.pdf"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Length': String(buffer.length),
          },
        });
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : 'Failed to generate PDF';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }

    // Return JSON response for preview
    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        imageUrl: receipt.image_url,
        extractedData: receipt.extracted_data,
        createdAt: receipt.created_at,
      },
      order: {
        id: order.id,
        orderNumber: order.order_number || order.id.slice(-8).toUpperCase(),
        totalAmount: order.total_amount,
        status: order.status,
      },
    });
  } catch (err) {
    console.error('Receipt API error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
