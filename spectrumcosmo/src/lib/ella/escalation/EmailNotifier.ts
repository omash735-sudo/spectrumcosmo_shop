import { sendMail } from '@/lib/mailer';

const OMASH_EMAIL = 'omash735@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';

interface EscalationData {
  customerName: string;
  customerEmail: string;
  orderNumber?: string;
  reason: string;
  conversationSummary: string;
  conversationId: string;
  timestamp: Date;
}

export async function sendEscalationEmail(data: EscalationData): Promise<void> {
  const { 
    customerName, 
    customerEmail, 
    orderNumber, 
    reason, 
    conversationSummary, 
    conversationId,
    timestamp 
  } = data;

  const adminLink = `${APP_URL}/admin/ella?conversation=${conversationId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background: #C96712; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 20px -20px;">
        <h2 style="color: white; margin: 0;">Ella Escalation Alert</h2>
      </div>
      
      <p style="font-size: 14px; color: #666;">This is an automated alert from Ella AI Assistant.</p>
      
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Reason:</strong> ${reason}</p>
        <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${customerName || 'Unknown'}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
        ${orderNumber ? `<p style="margin: 0 0 8px;"><strong>Order #:</strong> ${orderNumber}</p>` : ''}
        <p style="margin: 0;"><strong>Time:</strong> ${timestamp.toLocaleString()}</p>
      </div>
      
      <div style="background: #fafafa; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C96712;">
        <p style="margin: 0 0 8px; font-weight: bold;">Conversation Summary:</p>
        <p style="margin: 0; color: #333; white-space: pre-wrap;">${conversationSummary}</p>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${adminLink}" 
           style="background: #C96712; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">
          View Full Conversation
        </a>
      </div>
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        This is an automated notification from SpectrumCosmo AI Assistant.
        Reply to this email to contact the customer.
      </p>
    </div>
  `;

  const text = `
    Ella Escalation Alert
    --------------------
    Reason: ${reason}
    Customer: ${customerName || 'Unknown'}
    Email: ${customerEmail || 'Not provided'}
    ${orderNumber ? `Order #: ${orderNumber}` : ''}
    Time: ${timestamp.toLocaleString()}
    
    Conversation Summary:
    ${conversationSummary}
    
    View full conversation: ${adminLink}
  `;

  try {
    await sendMail({
      to: OMASH_EMAIL,
      subject: `Escalation: ${reason} - ${customerName || 'Customer'}`,
      text,
      html,
    });
    
    console.log(`Escalation email sent to ${OMASH_EMAIL}`);
  } catch (error) {
    console.error('Failed to send escalation email:', error);
    throw error;
  }
}

export async function sendOrderConfirmationEmail(data: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderId: string;
  totalAmount: number;
  currency: string;
}): Promise<void> {
  const { customerName, customerEmail, orderNumber, totalAmount, currency } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background: #C96712; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 20px -20px;">
        <h2 style="color: white; margin: 0;">Order Confirmation</h2>
      </div>
      
      <p style="font-size: 16px; color: #333;">Hi ${customerName},</p>
      <p style="font-size: 14px; color: #555;">Thank you for your order. Your order has been confirmed and is being processed.</p>
      
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Order #:</strong> ${orderNumber}</p>
        <p style="margin: 0;"><strong>Total:</strong> ${currency} ${totalAmount.toLocaleString()}</p>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${APP_URL}/account/orders" 
           style="background: #C96712; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">
          View Your Order
        </a>
      </div>
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        SpectrumCosmo - Wear your excitement with pride.
      </p>
    </div>
  `;

  const text = `
    Order Confirmation - #${orderNumber}
    --------------------
    Total: ${currency} ${totalAmount.toLocaleString()}
    View your order: ${APP_URL}/account/orders
  `;

  try {
    await sendMail({
      to: customerEmail,
      subject: `Order Confirmation #${orderNumber} - SpectrumCosmo`,
      text,
      html,
    });
    
    console.log(`Order confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
}
