// app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { deductStock, releaseReservedStock, getStatusDisplayInfo, sendDynamicStatusEmail } from '@/lib/order-utils';

// Types
interface OrderUpdateBody {
  id: string;
  status: string;
  trackingNumber?: string;
  trackingNotes?: string;
  adminNotes?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

interface UpdatedOrder {
  id: string;
  customer_email: string;
  customer_name: string;
  order_number: string | null;
  total_amount: number;
  tracking_number: string | null;
  payment_status: string;
  created_at: string;
  phone_number: string;
  location: string;
  payment_method: string;
  delivery_fee?: number;
  invoice_number?: string;
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json() as OrderUpdateBody;
    const { id, status, trackingNumber, trackingNotes, adminNotes } = body;
    
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const sql = getDb();
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Get current order status
    const [currentOrder] = await sql`
      SELECT status, paid_at FROM orders WHERE id = ${id}
    `;
    
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Stock Management
    if (status === 'approved' && currentOrder.status !== 'approved') {
      const stockDeducted = await deductStock(id);
      if (!stockDeducted) {
        return NextResponse.json({ 
          error: 'Failed to deduct stock. Items may be out of stock.' 
        }, { status: 409 });
      }
    }
    
    if ((status === 'declined' || status === 'cancelled') && 
        currentOrder.status !== 'declined' && 
        currentOrder.status !== 'cancelled') {
      await releaseReservedStock(id);
    }
    
    // Update order
    const [updatedOrder] = await sql`
      UPDATE orders 
      SET 
        status = ${status},
        updated_at = NOW(),
        tracking_number = COALESCE(${trackingNumber || null}, tracking_number),
        tracking_notes = COALESCE(${trackingNotes || null}, tracking_notes),
        admin_notes = COALESCE(${adminNotes || null}, admin_notes),
        paid_at = CASE 
          WHEN (${status} = 'approved' OR ${status} = 'delivered') AND paid_at IS NULL 
          THEN NOW() 
          ELSE paid_at 
        END
      WHERE id = ${id}
      RETURNING *
    ` as UpdatedOrder[];
    
    // Log status change
    if (currentOrder.status !== status) {
      await sql`
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, ip_address, notes, changed_at)
        VALUES (${id}, ${currentOrder.status}, ${status}, 'admin', ${ipAddress}, ${adminNotes || null}, NOW())
      `;
      
      // Send email notification for status change
      const statusInfo = await getStatusDisplayInfo(status);
      if (statusInfo?.send_email) {
        try {
          await sendDynamicStatusEmail({
            customerEmail: updatedOrder.customer_email,
            customerName: updatedOrder.customer_name,
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.order_number || updatedOrder.id.slice(-8),
            oldStatus: currentOrder.status,
            newStatus: status,
            totalAmount: updatedOrder.total_amount,
            trackingNumber: trackingNumber || updatedOrder.tracking_number || undefined,
            adminNotes: trackingNotes || adminNotes,
          });
        } catch (emailErr) {
          console.error('Failed to send status email:', emailErr);
        }
      }
    }

    // Invoice Email on Delivery
    if (status === 'delivered' && updatedOrder.payment_status === 'paid') {
      try {
        const { renderToStream } = await import('@react-pdf/renderer');
        const { InvoicePDF } = await import('@/components/invoice/InvoicePDF');
        const QRCode = await import('qrcode');
        const nodemailer = await import('nodemailer');
        
        // Fetch order items
        const items = await sql`SELECT * FROM order_items WHERE order_id = ${id}` as OrderItem[];
        
        const subtotal = items.reduce((sum: number, item: OrderItem) => sum + (item.quantity * item.unit_price), 0);
        
        const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${id}/tracking`;
        const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, { width: 120, margin: 1 });
        
        const pdfData = {
          invoiceNumber: updatedOrder.invoice_number || `INV-${id.slice(-8)}`,
          orderDate: new Date(updatedOrder.created_at).toLocaleDateString(),
          customerName: updatedOrder.customer_name,
          customerEmail: updatedOrder.customer_email,
          customerPhone: updatedOrder.phone_number,
          deliveryAddress: updatedOrder.location,
          paymentMethod: updatedOrder.payment_method,
          paymentStatus: updatedOrder.payment_status,
          trackingUrl,
          qrCodeDataUrl,
          items,
          subtotal,
          deliveryFee: updatedOrder.delivery_fee || 0,
          total: updatedOrder.total_amount,
          companyName: 'SpectrumCosmo',
          companyLogo: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
          companyAddress: 'Lilongwe, Malawi',
          companyEmail: 'hello@spectrumcosmo.shop',
          companyPhone: '',
        };

        // Create React element and render to stream
        const invoiceElement = InvoicePDF({ data: pdfData });
        const pdfStream = await renderToStream(invoiceElement);
        
        // FIX: Convert all chunks to Buffer without instanceof check
        const chunks: Buffer[] = [];
        for await (const chunk of pdfStream) {
          // Convert any chunk type to Buffer
          chunks.push(Buffer.from(chunk as any));
        }
        const pdfBuffer = Buffer.concat(chunks);

        // Check SMTP configuration
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpUser || !smtpPass) {
          console.error('SMTP configuration missing');
        } else {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: smtpUser, pass: smtpPass },
          });

          await transporter.sendMail({
            from: `"SpectrumCosmo" <${smtpUser}>`,
            to: updatedOrder.customer_email,
            subject: `Invoice for Order ${pdfData.invoiceNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #F97316;">Thank you for your purchase!</h2>
                <p>Your order has been delivered. Please find your invoice attached.</p>
                <a href="${trackingUrl}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
                <hr />
                <p style="font-size: 12px; color: #666;">SpectrumCosmo – Wear your excitement with pride.</p>
              </div>
            `,
            attachments: [{
              filename: `invoice-${pdfData.invoiceNumber}.pdf`,
              content: pdfBuffer,
            }],
          });
          
          console.log(`Invoice email sent to ${updatedOrder.customer_email}`);
        }
      } catch (emailErr) {
        console.error('Failed to send invoice email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Admin order update error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
