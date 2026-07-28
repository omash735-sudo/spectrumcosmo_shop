// app/api/admin/orders/[id]/receipt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { updateOrderStatus } from '@/lib/order-status';
import { sendMail } from '@/lib/mailer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id: orderId } = await params;

  try {
    const body = await req.json();
    const { imageUrl, receiptText, manualData } = body;

    const sql = getDb();

    // Get order details
    const [order] = await sql`
      SELECT 
        id,
        order_number,
        customer_name,
        customer_email,
        phone_number,
        delivery_address,
        total_amount,
        status,
        custom_delivery_method
      FROM orders 
      WHERE id = ${orderId}::uuid
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let trackingNumber = '';
    let trackingDetails: any = {};

    // Extract tracking info from manual data
    if (manualData) {
      trackingNumber = manualData.parcelId || '';
      trackingDetails = {
        parcelId: manualData.parcelId || '',
        receiverName: manualData.receiverName || '',
        receiverPhone: manualData.receiverPhone || '',
        receiverCity: manualData.receiverCity || '',
        totalAmount: manualData.totalAmount || '',
        paymentStatus: manualData.paymentStatus || 'cod_unpaid',
        truckNumber: manualData.truckNumber || '',
        deliveryCounter: manualData.deliveryCounter || '',
        senderName: manualData.senderName || '',
        dateTime: manualData.dateTime || new Date().toISOString(),
      };
    }

    // Extract tracking info from receipt text (CTS courier format)
    if (receiptText && !manualData) {
      const extracted = extractTrackingInfo(receiptText);
      trackingNumber = extracted.parcelId || '';
      trackingDetails = extracted;
    }

    // Store receipt info in database
    await sql`
      UPDATE orders 
      SET 
        receipt_image_url = ${imageUrl || null},
        receipt_text = ${receiptText || null},
        tracking_number = ${trackingNumber || null},
        tracking_details = ${JSON.stringify(trackingDetails)}::jsonb,
        updated_at = NOW()
      WHERE id = ${orderId}::uuid
    `;

    // Update order status to "shipped" if it was "approved" or "pending"
    const statusToSet = order.status === 'approved' || order.status === 'pending' ? 'shipped' : order.status;
    
    if (statusToSet !== order.status) {
      await updateOrderStatus({
        orderId,
        newStatusSlug: statusToSet,
        adminNotes: `Receipt uploaded. Tracking #: ${trackingNumber || 'N/A'}`,
        trackingNumber: trackingNumber || null,
        trackingNotes: `Receipt uploaded on ${new Date().toLocaleString()}`,
        changedBy: 'admin',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });
    }

    // Send email notification to customer
    await sendReceiptEmail(order, trackingNumber, trackingDetails, imageUrl);

    return NextResponse.json({
      success: true,
      message: 'Receipt uploaded successfully',
      trackingNumber,
      status: statusToSet,
    });
  } catch (err: any) {
    console.error('Receipt upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}

// Helper function to extract tracking info from CTS receipt text
function extractTrackingInfo(text: string) {
  const result: any = {};

  // Try to extract parcel ID (various formats)
  const parcelMatch = text.match(/Parcel\s*(?:ID|No|Number|#)?\s*[:.]?\s*([A-Z0-9-]+)/i) ||
                      text.match(/CTS-\d+/i) ||
                      text.match(/Tracking\s*(?:ID|No|Number|#)?\s*[:.]?\s*([A-Z0-9-]+)/i);
  if (parcelMatch) result.parcelId = parcelMatch[1] || parcelMatch[0];

  // Extract receiver name
  const nameMatch = text.match(/Receiver\s*(?:Name)?\s*[:.]?\s*([A-Za-z\s]+)/i) ||
                    text.match(/Consignee\s*[:.]?\s*([A-Za-z\s]+)/i) ||
                    text.match(/To\s*[:.]?\s*([A-Za-z\s]+)/i);
  if (nameMatch) result.receiverName = nameMatch[1]?.trim();

  // Extract phone number
  const phoneMatch = text.match(/Phone\s*[:.]?\s*([+\d\s-]{8,})/i) ||
                     text.match(/Mobile\s*[:.]?\s*([+\d\s-]{8,})/i) ||
                     text.match(/([+\d\s-]{10,})/);
  if (phoneMatch) result.receiverPhone = phoneMatch[1]?.trim();

  // Extract city/location
  const cityMatch = text.match(/City\s*[:.]?\s*([A-Za-z\s]+)/i) ||
                    text.match(/Location\s*[:.]?\s*([A-Za-z\s]+)/i) ||
                    text.match(/Destination\s*[:.]?\s*([A-Za-z\s]+)/i);
  if (cityMatch) result.receiverCity = cityMatch[1]?.trim();

  // Extract total amount
  const amountMatch = text.match(/Total\s*(?:Amount)?\s*[:.]?\s*MWK?\s*([\d,]+)/i) ||
                      text.match(/Amount\s*[:.]?\s*MWK?\s*([\d,]+)/i) ||
                      text.match(/MWK\s*([\d,]+)/i);
  if (amountMatch) result.totalAmount = amountMatch[1]?.replace(/,/g, '');

  // Extract truck number
  const truckMatch = text.match(/Truck\s*(?:No|Number)?\s*[:.]?\s*([A-Z0-9-]+)/i) ||
                     text.match(/Vehicle\s*(?:No|Number)?\s*[:.]?\s*([A-Z0-9-]+)/i);
  if (truckMatch) result.truckNumber = truckMatch[1]?.trim();

  // Extract delivery counter
  const counterMatch = text.match(/Counter\s*[:.]?\s*([A-Z0-9-]+)/i) ||
                       text.match(/Collection\s*(?:Point|Counter)?\s*[:.]?\s*([A-Z0-9-]+)/i);
  if (counterMatch) result.deliveryCounter = counterMatch[1]?.trim();

  return result;
}

// Helper function to send receipt email
async function sendReceiptEmail(order: any, trackingNumber: string, trackingDetails: any, imageUrl: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.shop';
  const trackingUrl = `${appUrl}/account/orders/${order.id}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
      <div style="background: #F97316; padding: 24px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Your Order Has Been Shipped!</h1>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size: 16px; color: #333;">Hi <strong>${order.customer_name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.5; color: #555;">
          Great news! Your order <strong>#${order.order_number}</strong> has been shipped and is on its way to you.
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; color: #333;">Tracking Information</h3>
          ${trackingNumber ? `<p style="margin: 0 0 8px;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
          ${trackingDetails.receiverName ? `<p style="margin: 0 0 8px;"><strong>Receiver:</strong> ${trackingDetails.receiverName}</p>` : ''}
          ${trackingDetails.receiverCity ? `<p style="margin: 0 0 8px;"><strong>Destination:</strong> ${trackingDetails.receiverCity}</p>` : ''}
          ${trackingDetails.truckNumber ? `<p style="margin: 0 0 8px;"><strong>Truck Number:</strong> ${trackingDetails.truckNumber}</p>` : ''}
          <p style="margin: 0;"><strong>Delivery Method:</strong> ${order.custom_delivery_method || order.delivery_method || 'Standard'}</p>
        </div>

        ${imageUrl ? `
        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
          <h3 style="margin: 0 0 12px; color: #333;">Receipt</h3>
          <img src="${imageUrl}" alt="Receipt" style="max-width: 100%; border-radius: 8px; border: 1px solid #e0e0e0;" />
        </div>
        ` : ''}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${trackingUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">
          Questions about your delivery? Reply to this email or contact us at support@spectrumcosmo.shop<br/>
          SpectrumCosmo Team – Wear your excitement with pride.
        </p>
      </div>
    </div>
  `;

  await sendMail({
    to: order.customer_email,
    subject: `Your Order #${order.order_number} Has Been Shipped – SpectrumCosmo`,
    text: `Your order #${order.order_number} has been shipped. Tracking #: ${trackingNumber || 'N/A'}. Track your order: ${trackingUrl}`,
    html,
  }).catch(err => console.error('Failed to send receipt email:', err));
}
