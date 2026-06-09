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
    
    // Default values if not set
    const rate = taxRate ? parseFloat(taxRate.setting_value) : 16.5;
    const name = taxName?.setting_value || 'VAT';
    
    return NextResponse.json({
      rate,
      name,
      is_enabled: rate > 0,
    });
  } catch (err) {
    console.error('Failed to fetch tax rate:', err);
    // Return default tax rate instead of error
    return NextResponse.json({
      rate: 16.5,
      name: 'VAT',
      is_enabled: true,
    });
  }
}
