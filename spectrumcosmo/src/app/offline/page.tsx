'use client';

import { useRouter } from 'next/navigation';
import { WifiOff, ArrowLeft, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={48} className="text-[var(--foreground-muted)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">You're Offline</h1>
        <p className="text-[var(--foreground-muted)] mb-8">
          Please check your internet connection and try again.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Go Back Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-[var(--background-secondary)] hover:bg-[var(--border)] text-[var(--foreground)] px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
