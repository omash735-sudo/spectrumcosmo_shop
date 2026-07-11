import { NextResponse } from 'next/server';
import { getStatusFlow } from '@/lib/order-status';

export async function GET() {
  try {
    // Remove await - getStatusFlow is synchronous
    const statuses = getStatusFlow();
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Failed to fetch order statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 });
  }
}
