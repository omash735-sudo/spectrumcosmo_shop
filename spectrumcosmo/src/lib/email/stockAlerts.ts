// lib/email/stockAlerts.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface StockAlertEmailParams {
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: 'low' | 'critical' | 'out';
  productUrl: string;
}

export async function sendStockAlertEmail(params: StockAlertEmailParams, adminEmails: string[]) {
  const { productName, currentStock, threshold, alertType, productUrl } = params;
  
  let subject = '';
  let severity = '';
  let urgency = '';
  
  switch (alertType) {
    case 'out':
      subject = `CRITICAL: ${productName} is OUT OF STOCK`;
      severity = 'Critical';
      urgency = 'Immediate action required';
      break;
    case 'critical':
      subject = `URGENT: ${productName} has critically low stock (${currentStock} units)`;
      severity = 'High';
      urgency = 'Restock within 24 hours recommended';
      break;
    case 'low':
      subject = `Alert: ${productName} stock below threshold (${currentStock}/${threshold})`;
      severity = 'Medium';
      urgency = 'Monitor and plan restock';
      break;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="background: ${alertType === 'out' ? '#dc2626' : alertType === 'critical' ? '#f97316' : '#eab308'}; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
        <h2 style="margin: 0;">${severity} Stock Alert</h2>
      </div>
      
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Current Stock:</strong> ${currentStock} units</p>
      <p><strong>Threshold:</strong> ${threshold} units</p>
      <p><strong>Status:</strong> ${alertType === 'out' ? 'Out of Stock' : alertType === 'critical' ? 'Critically Low' : 'Below Threshold'}</p>
      <p><strong>Urgency:</strong> ${urgency}</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
        <a href="${productUrl}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Product</a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/inventory" style="background: #6b7280; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-left: 10px;">Go to Inventory</a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">This alert was sent from SpectrumCosmo. You can manage alert preferences in the admin panel.</p>
    </div>
  `;
  
  const text = `
${severity} Stock Alert: ${productName}
Current Stock: ${currentStock} units
Threshold: ${threshold} units
Status: ${alertType === 'out' ? 'Out of Stock' : alertType === 'critical' ? 'Critically Low' : 'Below Threshold'}
Urgency: ${urgency}
View product: ${productUrl}
  `;
  
  for (const email of adminEmails) {
    try {
      await transporter.sendMail({
        from: `"SpectrumCosmo Stock Alerts" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error(`Failed to send stock alert to ${email}:`, err);
    }
  }
}
