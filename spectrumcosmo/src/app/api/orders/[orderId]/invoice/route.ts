import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const sql = getDb();

    const [order] = await sql`
      SELECT o.*, 
             json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id::text = ${orderId}
      GROUP BY o.id
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate HTML invoice
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${orderId.slice(-8)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { max-width: 150px; }
          .invoice-title { font-size: 28px; color: #F97316; margin: 20px 0; }
          .order-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #F97316; color: white; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png" class="logo" />
          <h1 class="invoice-title">INVOICE</h1>
        </div>
        
        <div class="order-info">
          <p><strong>Order #:</strong> ${orderId.slice(-8)}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${order.customer_name}</p>
          <p><strong>Email:</strong> ${order.customer_email}</p>
          <p><strong>Delivery Address:</strong> ${order.delivery_address}</p>
        </div>

        <table>
          <thead>
            <tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td>${item.product_name}${item.custom_details ? `<br/><small>${item.custom_details}</small>` : ''}</td>
                <td>${item.quantity}</td>
                <td>MWK ${Number(item.unit_price_usd).toLocaleString()}</td>
                <td>MWK ${(item.quantity * Number(item.unit_price_usd)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Subtotal: MWK ${(order.total_amount - (order.delivery_fee || 0)).toLocaleString()}</p>
          <p>Delivery Fee: MWK ${(order.delivery_fee || 0).toLocaleString()}</p>
          <p><strong>Total: MWK ${order.total_amount.toLocaleString()}</strong></p>
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with SpectrumCosmo!</p>
          <p>Wear your excitement with pride.</p>
        </div>
      </body>
      </html>
    `;

    // Return as downloadable PDF
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${orderId.slice(-8)}.html"`,
      },
    });
  } catch (err: any) {
    console.error('Invoice error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
