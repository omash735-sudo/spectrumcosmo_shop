// components/storefront/CategoryPopup.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, ArrowRight, Clock } from 'lucide-react';
import { useTheme } from 'next-themes';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirect = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleClose = () => {
    onClose();
  };

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="relative max-w-md w-full bg-[var(--background-card)] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
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
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${
            isDark 
              ? 'from-black/80 via-black/20 to-transparent' 
              : 'from-black/60 via-black/10 to-transparent'
          }`} />
        </div>

        <div className="p-6 text-center">
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Shop {category}
          </h3>
          <p className="text-[var(--foreground-muted)] text-sm mb-6">
            Explore our collection of {category.toLowerCase()} and find your perfect piece.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRedirect}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              Shop Now
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleClose}
              className="w-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm font-medium py-2 transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--foreground-muted)]">
            <Clock size={16} />
            <span>Redirecting in <strong className="text-[var(--primary)]">{countdown}</strong> seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
