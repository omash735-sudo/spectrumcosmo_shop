// app/api/tax/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    
    // Try to get tax rate from system_settings
    let taxRate = await queryOne<{ setting_value: string }>`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'tax_rate'
    `;
    
    let taxName = await queryOne<{ setting_value: string }>`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'tax_name'
    `;
    
    // If no setting exists, use 0
    let rate = 0;
    let name = 'VAT';
    
    if (taxRate) {
      rate = parseFloat(taxRate.setting_value);
    }
    
    if (taxName?.setting_value) {
      name = taxName.setting_value;
    }
    
    return NextResponse.json({
      rate,
      name,
      is_enabled: rate > 0,
    });
  } catch (err) {
    console.error('Failed to fetch tax rate:', err);
    return NextResponse.json({
      rate: 0,
      name: 'VAT',
      is_enabled: false,
    });
  }
}
