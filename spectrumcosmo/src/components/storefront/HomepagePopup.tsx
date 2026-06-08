'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Clock } from 'lucide-react';

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
            setIsOpen(true);
          }, delay);
          return () => clearTimeout(timer);
        }
      })
      .catch(console.error);
  }, [checkDismissal]);

  if (!isOpen || !settings?.enabled) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-200"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transition-all duration-200 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={() => dismissPopup(settings.dismissDays || 1)}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Close popup"
        >
          <X size={18} className="text-gray-600" />
        </button>

        {/* Image */}
        {settings.image_url && (
          <div className="relative h-48 w-full bg-gray-100">
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
        <div className="p-6 text-center">
          <h3 id="popup-title" className="text-2xl font-bold text-gray-900 mb-3">
            {settings.title || 'Special Offer'}
          </h3>
          
          <p className="text-gray-600 leading-relaxed mb-6">
            {settings.message || ''}
          </p>

          {/* Primary CTA */}
          {settings.button_text && settings.button_link && (
            <a
              href={settings.button_link}
              onClick={() => dismissPopup(settings.dismissDays || 1)}
              className="inline-flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {settings.button_text}
            </a>
          )}

          {/* Dismiss option */}
          {settings.showDismissOption !== false && (
            <button
              onClick={() => dismissPopup(settings.dismissDays || 1)}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors w-full py-2"
            >
              No, thanks
            </button>
          )}

          {/* Persistent dismissal indicator */}
          {(settings.dismissDays || 1) > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Clock size={10} />
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
