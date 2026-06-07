// app/api/orders/[orderId]/invoice/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import QRCode from 'qrcode';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoice/InvoicePDF';

interface OrderWithItems {
  id: string;
  invoice_number: string | null;
  created_at: Date;
  customer_name: string;
  customer_email: string;
  phone_number: string | null;
  delivery_address: string | null;
  location: string | null;
  payment_method: string;
  payment_status: string;
  delivery_fee: number | null;
  total_amount: number;
  items: any[];
}

interface SettingRow {
  setting_key: string;
  setting_value: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    const order = await queryOne<OrderWithItems>`
      SELECT o.*, 
             COALESCE(
               (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id),
               '[]'::json
             ) as items
      FROM orders o
      WHERE o.id::text = ${orderId}
      GROUP BY o.id
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let invoiceNumber = order.invoice_number;
    if (!invoiceNumber) {
      const year = new Date(order.created_at).getFullYear();
      const countResult = await queryOne<{ seq: string | number }>`
        SELECT COUNT(*) + 1 as seq FROM orders 
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
      `;
      const seq = Number(countResult?.seq ?? 1);
      invoiceNumber = `INV-${year}-${seq.toString().padStart(4, '0')}`;
      await sql`
        UPDATE orders SET invoice_number = ${invoiceNumber} 
        WHERE id = ${order.id}
      `;
    }

    const settingsRows = await queryAsArray<SettingRow>`
      SELECT setting_key, setting_value FROM system_settings
    `;
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((row) => {
      settingsMap[row.setting_key] = row.setting_value;
    });

    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}/tracking`;
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, { width: 120, margin: 1 });

    const items = order.items || [];
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + ((item.quantity || 1) * Number(item.unit_price || item.price || 0));
    }, 0);
    const deliveryFee = Number(order.delivery_fee || 0);
    const total = Number(order.total_amount || subtotal + deliveryFee);

    const pdfData = {
      invoiceNumber,
      orderDate: new Date(order.created_at).toLocaleDateString('en-GB'),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.phone_number,
      deliveryAddress: order.delivery_address || order.location || '',
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      trackingUrl,
      qrCodeDataUrl,
      items,
      subtotal,
      deliveryFee,
      total,
      companyName: settingsMap.company_name || 'SpectrumCosmo',
      companyLogo: settingsMap.company_logo || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
      companyAddress: settingsMap.company_address || 'Lilongwe, Malawi',
      companyEmail: settingsMap.company_email || 'hello@spectrumcosmo.shop',
      companyPhone: settingsMap.company_phone || '',
    };

    const pdfStream = await renderToStream(<InvoicePDF data={pdfData} />);

    // Convert stream to Buffer – safe for all chunk types
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else {
        // Convert string, Uint8Array, or any other type
        chunks.push(Buffer.from(chunk as any));
      }
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Invoice generation error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
