import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Helper to replace placeholders in invoice template
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Helper to get invoice template from database
async function getInvoiceTemplate(sql: any) {
  const templates = await sql`
    SELECT html_template, name 
    FROM email_templates 
    WHERE name = 'invoice_template' AND is_active = true 
    LIMIT 1
  `;
  return templates[0] || null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const sql = getDb();

    // Get order with items
    const [order] = await sql`
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

    // Get company settings from system_settings table
    const settings = await sql`SELECT setting_key, setting_value FROM system_settings`;
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

    // Get invoice template from email_templates table
    const invoiceTemplate = await getInvoiceTemplate(sql);
    
    // Safely get items array
    const items = order.items || [];
    
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + ((item.quantity || 1) * Number(item.unit_price_usd || item.price || 0));
    }, 0);
    
    const deliveryFee = Number(order.delivery_fee || 0);
    const total = Number(order.total_amount || subtotal + deliveryFee);

    // Generate items HTML from template or fallback
    let itemsHtml = '';
    if (invoiceTemplate && invoiceTemplate.html_template) {
      // Use the template's item structure (if it has a special placeholder for items)
      // For now, we'll generate items and inject
      itemsHtml = items.map((item: any) => `
        <tr>
          <td>${item.product_name || 'Product'}${item.custom_details ? `<br/><small>${item.custom_details}</small>` : ''}</td>
          <td>${item.quantity || 1}</td>
          <td>MWK ${Number(item.unit_price_usd || item.price || 0).toLocaleString()}</td>
          <td>MWK ${((item.quantity || 1) * Number(item.unit_price_usd || item.price || 0)).toLocaleString()}</td>
        </tr>
      `).join('');
    } else {
      itemsHtml = items.map((item: any) => `
        <tr>
          <td>${item.product_name || 'Product'}${item.custom_details ? `<br/><small>${item.custom_details}</small>` : ''}</td>
          <td>${item.quantity || 1}</td>
          <td>MWK ${Number(item.unit_price_usd || item.price || 0).toLocaleString()}</td>
          <td>MWK ${((item.quantity || 1) * Number(item.unit_price_usd || item.price || 0)).toLocaleString()}</td>
        </tr>
      `).join('');
    }

    // Prepare placeholder data for invoice template
    const placeholders = {
      order_number: orderId.slice(-8),
      order_date: new Date(order.created_at).toLocaleDateString(),
      customer_name: order.customer_name || 'N/A',
      customer_email: order.customer_email || 'N/A',
      customer_phone: order.phone_number || 'N/A',
      delivery_address: order.delivery_address || 'N/A',
      items_html: itemsHtml,
      subtotal: subtotal.toLocaleString(),
      delivery_fee: deliveryFee.toLocaleString(),
      total_amount: total.toLocaleString(),
      company_name: settingsMap.company_name || 'SpectrumCosmo',
      company_logo: settingsMap.company_logo || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
      company_address: settingsMap.company_address || 'Lilongwe, Malawi',
      company_email: settingsMap.company_email || 'hello@spectrumcosmo.shop',
      company_phone: settingsMap.company_phone || '',
      footer_text: settingsMap.footer_copyright || 'All rights reserved.',
      current_year: new Date().getFullYear().toString(),
    };

    let invoiceHtml: string;

    if (invoiceTemplate && invoiceTemplate.html_template) {
      // Use dynamic template from database
      invoiceHtml = replacePlaceholders(invoiceTemplate.html_template, placeholders);
    } else {
      // Fallback template (only used if no template exists in DB)
      invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice #{{order_number}}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #f9fafb; }
            .invoice-container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { max-width: 180px; margin-bottom: 16px; }
            .invoice-title { font-size: 32px; color: #F97316; margin: 0; }
            .order-info { background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
            .order-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .order-info-label { font-weight: 600; color: #374151; font-size: 12px; margin-bottom: 4px; }
            .order-info-value { color: #111827; font-size: 14px; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin: 24px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #F97316; color: white; font-weight: 600; }
            .total-row { text-align: right; margin-top: 20px; padding-top: 16px; border-top: 2px solid #e5e7eb; }
            .total-amount { font-size: 20px; font-weight: bold; color: #F97316; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <img src="{{company_logo}}" class="logo" alt="{{company_name}}" />
              <h1 class="invoice-title">INVOICE</h1>
            </div>
            
            <div class="order-info">
              <div class="order-info-grid">
                <div><p class="order-info-label">ORDER NUMBER</p><p class="order-info-value">#{{order_number}}</p></div>
                <div><p class="order-info-label">ORDER DATE</p><p class="order-info-value">{{order_date}}</p></div>
                <div><p class="order-info-label">CUSTOMER</p><p class="order-info-value">{{customer_name}}</p></div>
                <div><p class="order-info-label">EMAIL</p><p class="order-info-value">{{customer_email}}</p></div>
                <div><p class="order-info-label">PHONE</p><p class="order-info-value">{{customer_phone}}</p></div>
                <div><p class="order-info-label">DELIVERY ADDRESS</p><p class="order-info-value">{{delivery_address}}</p></div>
              </div>
            </div>

            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>{{items_html}}</tbody>
            </table>
            
            <div class="total-row">
              <p>Subtotal: MWK {{subtotal}}</p>
              <p>Delivery Fee: MWK {{delivery_fee}}</p>
              <p class="total-amount">Total: MWK {{total_amount}}</p>
            </div>
            
            <div class="footer">
              <p>{{company_name}} | {{company_address}}</p>
              <p>{{company_email}} | {{company_phone}}</p>
              <p>&copy; {{current_year}} {{company_name}}. {{footer_text}}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      invoiceHtml = replacePlaceholders(invoiceHtml, placeholders);
    }

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
