// components/storefront/CategoryPopup.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, ArrowRight, Clock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryPopupProps {
  category: string;
  imageUrl: string;
  onClose: () => void;
}

export default function CategoryPopup({ category, imageUrl, onClose }: CategoryPopupProps) {
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      handleRedirect();
    }
  }, [countdown]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleRedirect = useCallback(() => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    router.push(`/products?category=${encodeURIComponent(category)}`);
  }, [isRedirecting, router, category]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  const progress = (countdown / 10) * 100;
  const circumference = 2 * Math.PI * 28;

  // Don't render until mounted on client
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <motion.div
          ref={popupRef}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md bg-[var(--background-card)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="relative w-full aspect-[4/3] bg-[var(--background-secondary)]">
            <Image
              src={imageUrl}
              alt={category}
              fill
              className="object-cover"
              priority
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${
              isDark 
                ? 'from-black/80 via-black/20 to-transparent' 
                : 'from-black/60 via-black/10 to-transparent'
            }`} />
          </div>

          <div className="p-5 sm:p-6 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2">
              Shop {category}
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4 sm:mb-6">
              Explore our collection of {category.toLowerCase()} and find your perfect piece.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRedirect}
                disabled={isRedirecting}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isRedirecting ? 'Redirecting...' : (
                  <>
                    Shop Now
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm font-medium py-2 transition-colors"
              >
                Continue Browsing
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-[var(--background-secondary)]"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="28"
                    cy="28"
                  />
                  <circle
                    className="text-[var(--primary)] transition-all duration-1000 ease-linear"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progress / 100) * circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="28"
                    cy="28"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-[var(--foreground)]">
                  {countdown}s
                </span>
              </div>
              
              <span className="text-sm text-[var(--foreground-muted)]">
                Redirecting automatically
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
