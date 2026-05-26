import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ReceiptData } from './receipt-extractor';

/**
 * Generate PDF receipt from receipt data
 */
export async function generateReceiptPDF(
  receiptData: ReceiptData,
  orderData: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = height - 50;
  const lineHeight = 20;
  
  // Header
  page.drawText('SPECTRUMCOSMO', { x: 50, y, size: 20, font: boldFont, color: rgb(0.976, 0.459, 0.086) });
  y -= lineHeight;
  page.drawText('Order Receipt', { x: 50, y, size: 14, font: boldFont });
  y -= lineHeight * 2;
  
  // Order info
  page.drawText(`Order #: ${orderData.orderNumber}`, { x: 50, y, size: 10, font });
  y -= lineHeight;
  page.drawText(`Date: ${orderData.orderDate}`, { x: 50, y, size: 10, font });
  y -= lineHeight;
  page.drawText(`Customer: ${orderData.customerName}`, { x: 50, y, size: 10, font });
  y -= lineHeight;
  page.drawText(`Email: ${orderData.customerEmail}`, { x: 50, y, size: 10, font });
  y -= lineHeight * 2;
  
  // Divider
  page.drawLine({ start: { x: 50, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= lineHeight;
  
  // Items header
  page.drawText('Items', { x: 50, y, size: 12, font: boldFont });
  y -= lineHeight;
  
  // Items list
  for (const item of orderData.items) {
    page.drawText(`${item.name} x${item.quantity}`, { x: 50, y, size: 10, font });
    page.drawText(`MWK ${(item.price * item.quantity).toLocaleString()}`, { x: 400, y, size: 10, font });
    y -= lineHeight;
  }
  
  y -= lineHeight;
  page.drawLine({ start: { x: 50, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= lineHeight;
  
  // Total
  page.drawText(`Total Amount:`, { x: 350, y, size: 12, font: boldFont });
  page.drawText(`MWK ${orderData.totalAmount.toLocaleString()}`, { x: 450, y, size: 12, font: boldFont, color: rgb(0.976, 0.459, 0.086) });
  y -= lineHeight * 2;
  
  // Courier / Tracking Info
  if (receiptData.parcelId) {
    page.drawText('Delivery Tracking', { x: 50, y, size: 12, font: boldFont });
    y -= lineHeight;
    page.drawText(`Parcel ID: ${receiptData.parcelId}`, { x: 50, y, size: 10, font });
    y -= lineHeight;
  }
  if (receiptData.truckNumber) {
    page.drawText(`Truck #: ${receiptData.truckNumber}`, { x: 50, y, size: 10, font });
    y -= lineHeight;
  }
  if (receiptData.deliveryCounter) {
    page.drawText(`Delivery Point: ${receiptData.deliveryCounter}`, { x: 50, y, size: 10, font });
    y -= lineHeight;
  }
  if (receiptData.totalAmount) {
    page.drawText(`Receipt Total: MWK ${receiptData.totalAmount.toLocaleString()}`, { x: 50, y, size: 10, font });
    y -= lineHeight;
  }
  if (receiptData.paymentStatus === 'cod_unpaid') {
    page.drawText(`Payment Status: COD - Awaiting Payment at Collection`, { x: 50, y, size: 10, font, color: rgb(0.9, 0.5, 0.1) });
  }
  
  // Footer
  page.drawText('Thank you for shopping with SpectrumCosmo!', {
    x: 50,
    y: 50,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return await pdfDoc.save();
}
