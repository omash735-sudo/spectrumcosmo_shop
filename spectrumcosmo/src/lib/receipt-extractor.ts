export interface ReceiptData {
  // CTS Courier specific fields
  parcelId: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  totalAmount: number;
  parcelValue?: number;
  paymentStatus: 'paid' | 'cod_unpaid' | 'partial';
  truckNumber?: string;
  deliveryCounter?: string;
  senderName?: string;
  senderPhone?: string;
  parcelType?: string;
  subTotal?: number;
  vat?: number;
  dateTime?: string;
  
  // Metadata
  extractedAt: Date;
  rawText?: string;
  receiptType: 'cts_courier' | 'manual';
}

/**
 * Parse CTS Courier receipt text format
 * Example input from the image you shared
 */
export function parseCTSReceipt(receiptText: string): ReceiptData | null {
  const lines = receiptText.split('\n');
  
  const data: Partial<ReceiptData> = {
    receiptType: 'cts_courier',
    extractedAt: new Date(),
    paymentStatus: 'cod_unpaid',
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Parcel ID
    if (trimmed.includes('Parcel ID:')) {
      data.parcelId = trimmed.split('Parcel ID:')[1]?.trim();
    }
    // Receiver Name
    else if (trimmed.includes('Receiver Name:')) {
      data.receiverName = trimmed.split('Receiver Name:')[1]?.trim();
    }
    // Receiver Phone
    else if (trimmed.includes('Receiver Phone:')) {
      data.receiverPhone = trimmed.split('Receiver Phone:')[1]?.trim();
    }
    // Receiver City
    else if (trimmed.includes('Receiver City:')) {
      data.receiverCity = trimmed.split('Receiver City:')[1]?.trim();
    }
    // Total Amount
    else if (trimmed.includes('Total:')) {
      const amountStr = trimmed.split('Total:')[1]?.replace('MWK', '').trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) data.totalAmount = amount;
    }
    // Parcel Value
    else if (trimmed.includes('Parcel Value:')) {
      const amountStr = trimmed.split('Parcel Value:')[1]?.replace('MWK', '').trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) data.parcelValue = amount;
    }
    // Payment Status
    else if (trimmed.includes('P. Status:')) {
      const status = trimmed.split('P. Status:')[1]?.trim();
      if (status?.includes('COD/Unpaid')) data.paymentStatus = 'cod_unpaid';
      else if (status?.includes('Paid')) data.paymentStatus = 'paid';
    }
    // Truck Number
    else if (trimmed.includes('Truck Number:')) {
      data.truckNumber = trimmed.split('Truck Number:')[1]?.trim();
    }
    // Delivery Counter
    else if (trimmed.includes('Delivery Counter:')) {
      data.deliveryCounter = trimmed.split('Delivery Counter:')[1]?.trim();
    }
    // Sender Name
    else if (trimmed.includes('Order Name:')) {
      data.senderName = trimmed.split('Order Name:')[1]?.trim();
    }
    // Sender Phone
    else if (trimmed.includes('Sender Phone:')) {
      data.senderPhone = trimmed.split('Sender Phone:')[1]?.trim();
    }
    // Parcel Type
    else if (trimmed.includes('Parcel Type:')) {
      data.parcelType = trimmed.split('Parcel Type:')[1]?.trim();
    }
    // Sub Total
    else if (trimmed.includes('Sub Total:')) {
      const amountStr = trimmed.split('Sub Total:')[1]?.replace('MWK', '').trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) data.subTotal = amount;
    }
    // VAT
    else if (trimmed.includes('VAT:')) {
      const amountStr = trimmed.split('VAT:')[1]?.replace('MWK', '').trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) data.vat = amount;
    }
    // Date & Time
    else if (trimmed.includes('Date & Time:')) {
      data.dateTime = trimmed.split('Date & Time:')[1]?.trim();
    }
  }
  
  // Validate required fields
  if (!data.parcelId || !data.receiverName || !data.totalAmount) {
    console.error('CTS receipt missing required fields', data);
    return null;
  }
  
  return data as ReceiptData;
}

/**
 * Manual receipt data entry from admin form
 */
export function createManualReceiptData(formData: Record<string, any>): ReceiptData {
  return {
    parcelId: formData.parcelId || `MANUAL-${Date.now()}`,
    receiverName: formData.receiverName || '',
    receiverPhone: formData.receiverPhone || '',
    receiverCity: formData.receiverCity || '',
    totalAmount: parseFloat(formData.totalAmount) || 0,
    parcelValue: formData.parcelValue ? parseFloat(formData.parcelValue) : undefined,
    paymentStatus: formData.paymentStatus === 'paid' ? 'paid' : 'cod_unpaid',
    truckNumber: formData.truckNumber,
    deliveryCounter: formData.deliveryCounter,
    senderName: formData.senderName,
    senderPhone: formData.senderPhone,
    parcelType: formData.parcelType,
    subTotal: formData.subTotal ? parseFloat(formData.subTotal) : undefined,
    vat: formData.vat ? parseFloat(formData.vat) : undefined,
    dateTime: formData.dateTime || new Date().toISOString(),
    extractedAt: new Date(),
    receiptType: 'manual',
  };
}

/**
 * Future: Onekhusa OCR integration
 */
export async function extractReceiptWithOCR(imageUrl: string): Promise<ReceiptData | null> {
  // Placeholder for Onekhusa API integration
  // When API key is available, implement:
  // const response = await fetch('https://api.onekhusa.com/v1/ocr/receipt', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${process.env.ONEKHUSA_API_KEY}` },
  //   body: JSON.stringify({ image_url: imageUrl })
  // });
  // const { extracted_text } = await response.json();
  // return parseCTSReceipt(extracted_text);
  
  console.log('OCR integration pending - use manual entry');
  return null;
}
