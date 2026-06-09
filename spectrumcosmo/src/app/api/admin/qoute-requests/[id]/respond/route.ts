import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { deliveryFee, notes, approved } = await req.json();

    if (!deliveryFee || deliveryFee <= 0) {
      return NextResponse.json({ error: 'Valid delivery fee is required' }, { status: 400 });
    }

    const sql = getDb();

    // Get quote request
    const quoteRequest = await queryOne<{
      id: number;
      order_id: string;
      customer_name: string;
      customer_email: string;
      delivery_location: string;
    }>`
      SELECT id, order_id, customer_name, customer_email, delivery_location
      FROM quote_requests
      WHERE id = ${id}
    `;

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Update quote request
    await sql`
      UPDATE quote_requests
      SET admin_quote_fee = ${deliveryFee},
          admin_quote_notes = ${notes || null},
          status = ${approved ? 'quoted' : 'rejected'},
          responded_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
    `;

    // Update order
    await sql`
      UPDATE orders
      SET quoted_delivery_fee = ${deliveryFee},
          delivery_quote_status = ${approved ? 'quoted' : 'rejected'},
          quote_responded_at = NOW(),
          admin_quote_notes = ${notes || null}
      WHERE id = ${quoteRequest.order_id}::uuid
    `;

    if (approved) {
      // Send quote email to customer
      const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay-delivery-quote?order=${quoteRequest.order_id}`;
      const orderNumber = quoteRequest.order_id.slice(-8);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <div style="background: #F97316; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">Delivery Fee Quote Ready</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>${quoteRequest.customer_name}</strong>,</p>
            <p>Great news! We have calculated the delivery fee for your order.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <h2 style="color: #166534; margin: 0;">MWK ${deliveryFee.toLocaleString()}</h2>
              <p style="color: #166534; margin: 5px 0 0;">Delivery Fee</p>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order #:</strong> ${orderNumber}</p>
              <p><strong>Delivery Location:</strong> ${quoteRequest.delivery_location}</p>
              ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${paymentUrl}" style="display: inline-block; background: #F97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 40px; font-weight: bold;">
                Pay Delivery Fee
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Once payment is confirmed, your order will be processed and shipped.
            </p>
          </div>
        </div>
      `;

      await sendMail({
        to: quoteRequest.customer_email,
        subject: `Delivery Fee Quote - Order #${orderNumber}`,
        text: `Your delivery fee is MWK ${deliveryFee.toLocaleString()}. Pay here: ${paymentUrl}`,
        html: emailHtml,
      }).catch(err => console.error('Email failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'Quote sent to customer' : 'Quote request rejected',
    });
  } catch (err) {
    console.error('Failed to respond to quote:', err);
    return NextResponse.json({ error: 'Failed to respond to quote' }, { status: 500 });
  }
}
