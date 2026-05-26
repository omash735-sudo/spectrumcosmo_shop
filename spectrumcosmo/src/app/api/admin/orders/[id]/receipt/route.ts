import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { parseCTSReceipt, createManualReceiptData, extractReceiptWithOCR } from '@/lib/receipt-extractor';
import { updateOrderStatus } from '@/lib/order-status';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const orderId = params.id;
  const formData = await req.formData();
  
  const imageUrl = formData.get('imageUrl') as string;
  const receiptText = formData.get('receiptText') as string;
  const manualData = formData.get('manualData') ? JSON.parse(formData.get('manualData') as string) : null;
  const useOcr = formData.get('useOcr') === 'true';

  const sql = getDb();
  const admin = requireAdmin(req);
  const adminId = admin?.id;

  try {
    let receiptData = null;

    // Priority: 1. Manual entry, 2. Text paste, 3. OCR (future)
    if (manualData) {
      receiptData = createManualReceiptData(manualData);
    } else if (receiptText) {
      receiptData = parseCTSReceipt(receiptText);
      if (!receiptData) {
        return NextResponse.json({ error: 'Could not parse receipt text. Please check format or use manual entry.' }, { status: 400 });
      }
    } else if (useOcr && imageUrl) {
      receiptData = await extractReceiptWithOCR(imageUrl);
      if (!receiptData) {
        return NextResponse.json({ error: 'OCR extraction failed. Please enter details manually.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'No receipt data provided' }, { status: 400 });
    }

    // Save receipt to database
    const [receipt] = await sql`
      INSERT INTO order_receipts (order_id, image_url, extracted_data, receipt_type, uploaded_by, created_at)
      VALUES (${orderId}, ${imageUrl || null}, ${JSON.stringify(receiptData)}, ${receiptData.receiptType}, ${adminId || null}, NOW())
      RETURNING *
    `;

    // Update order with tracking info from receipt
    if (receiptData.truckNumber || receiptData.parcelId) {
      await sql`
        UPDATE orders 
        SET tracking_number = COALESCE(${receiptData.truckNumber || receiptData.parcelId}, tracking_number),
            tracking_notes = CONCAT(COALESCE(tracking_notes, ''), '\nReceipt uploaded: ', ${receiptData.parcelId || ''}),
            updated_at = NOW()
        WHERE id = ${orderId}
      `;
    }

    // Optionally update order status to 'in_transit' if tracking available
    if (receiptData.truckNumber || receiptData.parcelId) {
      await updateOrderStatus({
        orderId,
        newStatusSlug: 'in_transit',
        adminNotes: `Tracking added: ${receiptData.truckNumber || receiptData.parcelId}`,
        changedBy: 'admin',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });
    }

    return NextResponse.json({ 
      success: true, 
      receipt, 
      extractedData: receiptData 
    });
  } catch (err: any) {
    console.error('Receipt upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const orderId = params.id;
  const sql = getDb();

  const receipts = await sql`
    SELECT r.*, u.name as uploaded_by_name
    FROM order_receipts r
    LEFT JOIN users u ON u.id = r.uploaded_by
    WHERE r.order_id = ${orderId}
    ORDER BY r.created_at DESC
  `;

  return NextResponse.json({ receipts });
}
