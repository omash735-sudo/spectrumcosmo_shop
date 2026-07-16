'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Clock, AlertCircle } from 'lucide-react';

interface PopupSettings {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_link: string;
  delaySeconds?: number;
  showDismissOption?: boolean;
  dismissDays?: number;
}

export default function HomepagePopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showDelay, setShowDelay] = useState(true);

  // Check if user has dismissed the popup within the configured time
  const checkDismissal = useCallback((dismissDays: number = 1): boolean => {
    const dismissed = localStorage.getItem('popup_dismissed_until');
    if (!dismissed) return false;
    
    const dismissedUntil = new Date(parseInt(dismissed));
    const now = new Date();
    return now < dismissedUntil;
  }, []);

  // Save dismissal with expiry
  const dismissPopup = useCallback((days: number = 1) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    localStorage.setItem('popup_dismissed_until', expiryDate.getTime().toString());
    sessionStorage.setItem('popup_seen_session', 'true');
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 200);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dismissPopup(settings?.dismissDays || 1);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, dismissPopup, settings]);

  // Focus trap when modal is open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Fetch settings and decide whether to show
  useEffect(() => {
    fetch('/api/homepage/popup')
      .then(res => res.json())
      .then((data: PopupSettings) => {
        setSettings(data);
        
        if (!data.enabled) return;
        
        // Check session dismissal (for current browsing session)
        const hasSeenSession = sessionStorage.getItem('popup_seen_session');
        
        // Check persistent dismissal (based on days)
        const isPersistentlyDismissed = checkDismissal(data.dismissDays || 1);
        
        if (!hasSeenSession && !isPersistentlyDismissed) {
          // Show after configured delay
          const delay = (data.delaySeconds || 2) * 1000;
          const timer = setTimeout(() => {
            setShowDelay(false);
            setIsOpen(true);
          }, delay);
          return () => {
            clearTimeout(timer);
            setShowDelay(true);
          };
        }
      })
      .catch(console.error);
  }, [checkDismissal]);

  if (!isOpen || !settings?.enabled) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-200"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div 
        ref={modalRef}
        className={`relative bg-[var(--background-card)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transition-all duration-200 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={() => dismissPopup(settings.dismissDays || 1)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 bg-[var(--background-card)]/90 hover:bg-[var(--background-card)] rounded-full shadow-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Close popup"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--foreground-muted)]" />
        </button>

        {/* Image */}
        {settings.image_url && (
          <div className="relative h-40 sm:h-48 w-full bg-[var(--background-secondary)]">
            <Image 
              src={settings.image_url} 
              alt={settings.title || 'Promotion'} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 text-center">
          <h3 id="popup-title" className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">
            {settings.title || 'Special Offer'}
          </h3>
          
          <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed mb-4 sm:mb-6">
            {settings.message || ''}
          </p>

          {/* Primary CTA */}
          {settings.button_text && settings.button_link && (
            <a
              href={settings.button_link}
              onClick={() => dismissPopup(settings.dismissDays || 1)}
              className="inline-flex items-center justify-center w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 text-sm sm:text-base min-h-[48px]"
            >
              {settings.button_text}
            </a>
          )}

          {/* Dismiss option */}
          {settings.showDismissOption !== false && (
            <button
              onClick={() => dismissPopup(settings.dismissDays || 1)}
              className="mt-3 sm:mt-4 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors w-full py-2 min-h-[36px]"
            >
              No, thanks
            </button>
          )}

          {/* Persistent dismissal indicator */}
          {(settings.dismissDays || 1) > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 border-t border-[var(--border)]">
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] flex items-center justify-center gap-1">
                <Clock size={10} className="sm:w-3 sm:h-3" />
                Won't show again for {settings.dismissDays || 1} day{settings.dismissDays !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
