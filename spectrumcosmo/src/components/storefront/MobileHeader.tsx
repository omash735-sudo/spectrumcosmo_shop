'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser } from './UserProvider';
import NotificationBell from '@/components/ui/NotificationBell';

export default function MobileHeader() {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  const logoSvg = isDark
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426887/spectrumcosmo_mark_white_lnavri.svg"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_black_fahcqs.svg";

  const logoPng = isDark
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_white_1024px_mppdiq.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426890/spectrumcosmo_mark_black_1024px_cwui04.png";

  const isLoggedIn = !!user;
  const profileImage = user?.profileImage;
  const displayName = user?.name || user?.email?.split('@')[0] || 'Account';

  return (
    <div className="md:hidden bg-[var(--background-card)] border-b border-[var(--border)]">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Logo + Name */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group" style={{ height: '36px' }}>
          <img
            src={logoSvg}
            alt="SpectrumCosmo"
            className="h-7 w-auto"
            onError={(e) => {
              e.currentTarget.src = logoPng;
            }}
            style={{
              display: 'block',
              width: 'auto',
              height: '28px',
              maxHeight: '36px',
              objectFit: 'contain',
            }}
          />
          <span className="text-base font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground-muted)] bg-clip-text text-transparent whitespace-nowrap">
            Spectrum<span className="text-[var(--primary)]">Cosmo</span>
          </span>
        </Link>

        {/* Right: Notification + User */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isLoggedIn && <NotificationBell />}
          
          <Link
            href={isLoggedIn ? '/account' : '/login'}
            className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label={isLoggedIn ? 'Account' : 'Sign in'}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <User size={22} className="text-[var(--foreground-muted)]" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
