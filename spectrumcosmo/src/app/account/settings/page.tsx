'use client';

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] py-4 sm:py-6 md:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-1 sm:mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-4 sm:h-5 md:h-6 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Settings</h1>
            </div>
          </div>
          <p className="text-[var(--foreground-muted)] text-xs sm:text-sm">Manage your account preferences and security</p>
        </div>

        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
          <p className="text-[var(--foreground)]">Settings page is working!</p>
          <p className="text-[var(--foreground-muted)] text-sm mt-2">If you see this, the page compiles correctly.</p>
        </div>
      </div>
    </main>
  );
}
