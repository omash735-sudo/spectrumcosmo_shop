import { NextResponse } from 'next/server';
import { getStatusFlow } from '@/lib/order-status';

export async function GET() {
  const statuses = await getStatusFlow();
  return NextResponse.json(statuses);
}
