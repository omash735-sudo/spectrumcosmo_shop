export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0a9 9 0 01-12.728 0m12.728 0L21 21M4 4l2.636 2.636m0 0a9 9 0 0112.728 0M7.05 7.05a9 9 0 0112.728 0" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">You're Offline</h1>
        <p className="text-[var(--foreground-muted)] mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
