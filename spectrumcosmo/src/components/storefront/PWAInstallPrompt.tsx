'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  // Logo URLs
  const logoSvg = isDark
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426887/spectrumcosmo_mark_white_lnavri.svg"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_black_fahcqs.svg";

  const logoPng = isDark
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_white_1024px_mppdiq.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426890/spectrumcosmo_mark_black_1024px_cwui04.png";

  useEffect(() => {
    // Check if already installed (iOS)
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Check if installed via display-mode (Android/others)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    
    if (isIOSStandalone || isStandalone || isFullscreen) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay (don't show immediately)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS - show instructions
      alert('To install this app on your iPhone:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if installed, dismissed, or not on mobile
  if (isInstalled || showPrompt === false) {
    return null;
  }

  // Check if dismissed in this session
  if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-[9998] max-w-sm">
      <div className="bg-[var(--background-card)] rounded-2xl shadow-2xl border border-[var(--border)] p-4 animate-slide-up">
        <div className="flex items-start gap-3">
          {/* Logo instead of phone icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center border border-[var(--border)] overflow-hidden">
            <img
              src={logoSvg}
              alt="SpectrumCosmo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.currentTarget.src = logoPng;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[var(--foreground)]">
              Install <span className="text-[var(--primary)]">SpectrumCosmo</span>
            </h4>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              Get the app-like experience with faster access.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-medium px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs font-medium px-3 py-2 rounded-full transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} className="text-[var(--foreground-muted)]" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
