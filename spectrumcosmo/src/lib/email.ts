import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export interface OrderEmailData {
  customerName: string
  customerEmail: string
  productName: string
  paymentMethod: string
  deliveryMethod: string
  totalAmount: number
  currency: string
  orderId: string
  status: string
  customDetails?: string
  createdAt: string
}

function generateReceiptHTML(order: OrderEmailData): string {
  const statusColor = order.status === 'completed' ? '#16a34a' : order.status === 'processing' ? '#2563eb' : '#d97706'
  const statusLabel = order.status === 'completed' ? 'Completed ✓' : order.status === 'processing' ? 'Processing' : 'Pending'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpectrumCosmo Order Receipt</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#111111;padding:32px 40px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:36px;height:36px;background:#F97316;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:18px;">🛍</span>
        </div>
        <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
          Spectrum<span style="color:#F97316;">Cosmo</span>
        </span>
      </div>
      <p style="color:#9ca3af;margin:0;font-size:13px;">Order Receipt</p>
    </div>

    <!-- Status Banner -->
    <div style="background:${statusColor}15;border-bottom:3px solid ${statusColor};padding:16px 40px;text-align:center;">
      <span style="color:${statusColor};font-weight:700;font-size:15px;">Order ${statusLabel}</span>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#111111;font-size:16px;margin:0 0 24px;">
        Hi <strong>${order.customerName}</strong>, ${order.status === 'completed' ? 'your order has been completed! 🎉' : 'thank you for your order!'}
      </p>

      <!-- Order ID -->
      <div style="background:#f9f9f9;border-radius:10px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">Order ID</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111111;font-family:monospace;">${order.orderId}</p>
      </div>

      <!-- Product Info -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#f9f9f9;">
          <td style="padding:12px 16px;border-radius:10px 10px 0 0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Product</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111111;">${order.productName}</p>
          </td>
        </tr>
        ${order.customDetails ? `
        <tr>
          <td style="padding:12px 16px;background:#fffbf5;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Custom Instructions</p>
            <p style="margin:4px 0 0;font-size:13px;color:#374151;">${order.customDetails}</p>
          </td>
        </tr>` : ''}
      </table>

      <!-- Order Details -->
      <div style="border:1px solid #f3f4f6;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#6b7280;">Payment Method</span>
          <span style="font-size:13px;font-weight:600;color:#111111;">${order.paymentMethod}</span>
        </div>
        <div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#6b7280;">Delivery Method</span>
          <span style="font-size:13px;font-weight:600;color:#111111;">${order.deliveryMethod}</span>
        </div>
        <div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#6b7280;">Order Date</span>
          <span style="font-size:13px;font-weight:600;color:#111111;">${new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div style="padding:14px 16px;background:#fff7ed;display:flex;justify-content:space-between;">
          <span style="font-size:15px;font-weight:700;color:#111111;">Total Amount</span>
          <span style="font-size:16px;font-weight:800;color:#F97316;">${order.currency} ${Number(order.totalAmount).toLocaleString()}</span>
        </div>
      </div>

      ${order.status === 'pending' ? `
      <!-- Payment Instructions -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ea580c;">⚡ Next Step — Complete Your Payment</p>
        <p style="margin:0;font-size:13px;color:#92400e;">Please send your payment via <strong>${order.paymentMethod}</strong> to complete your order. Your order will be processed once payment is confirmed.</p>
      </div>` : ''}

      <!-- Track Order -->
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/orders"
          style="display:inline-block;background:#F97316;color:white;font-weight:700;font-size:14px;padding:14px 32px;border-radius:50px;text-decoration:none;">
          Track Your Order →
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        Questions? Reply to this email or contact us on WhatsApp.<br/>
        Thank you for shopping with SpectrumCosmo 🧡
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        © ${new Date().getFullYear()} SpectrumCosmo · Malawi's Premier Anime Merchandise Store
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendOrderEmail(order: OrderEmailData, subject?: string) {
  if (!order.customerEmail) return

  const emailSubject = subject || (
    order.status === 'completed'
      ? `✅ Order Completed — ${order.productName} | SpectrumCosmo`
      : `🧡 Order Received — ${order.productName} | SpectrumCosmo`
  )

  await transporter.sendMail({
    from: `"SpectrumCosmo" <${process.env.GMAIL_USER}>`,
    to: order.customerEmail,
    subject: emailSubject,
    html: generateReceiptHTML(order),
  })
}
