// app/api/queue/init/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeQueueWorker } from '@/lib/queue-worker';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    await initializeQueueWorker();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
