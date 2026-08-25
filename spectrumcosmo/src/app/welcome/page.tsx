'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-sm w-full text-center">
        {/* Logo Section */}
        <div className="mb-8">
          <img
            src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_black_1024px_cwui04.png"
            alt="SpectrumCosmo"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold font-anton text-[var(--foreground)]">
            Spectrum<span className="text-[var(--primary)]">Cosmo</span>
          </h1>
          <p className="text-[var(--foreground-muted)] mt-2 text-sm">
            Wear your excitement with pride
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/auth"
            className="block w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20"
          >
            Sign In / Create Account
          </Link>
          <Link
            href="/"
            className="block w-full text-[var(--foreground-muted)] text-sm py-2 hover:text-[var(--foreground)] transition-colors"
          >
            Skip & Browse →
          </Link>
        </div>

        {/* Footer Text */}
        <p className="text-[10px] text-[var(--foreground-muted)] mt-8">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
