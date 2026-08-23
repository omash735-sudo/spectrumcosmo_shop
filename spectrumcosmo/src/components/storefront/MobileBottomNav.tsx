'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from './CartProvider';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

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

  const navItems: NavItem[] = [
    { name: 'Home', href: '/', icon: <Home size={24} strokeWidth={1.8} /> },
    { name: 'Products', href: '/products', icon: <ShoppingBag size={24} strokeWidth={1.8} /> },
    { name: 'Cart', href: '/cart', icon: <ShoppingCart size={24} strokeWidth={1.8} /> },
    { name: 'Account', href: '/account', icon: <User size={24} strokeWidth={1.8} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--background-card)] border-t border-[var(--border)] safe-bottom">
        <div className="flex items-center justify-around h-[68px] px-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-xl transition-all duration-200',
                  active
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.name === 'Cart' && totalItems > 0 && (
                    <span className="absolute -top-1 -right-2 bg-[var(--primary)] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </div>
                <span className={clsx(
                  'text-[9px] font-medium transition-colors',
                  active ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'
                )}>
                  {item.name}
                </span>
                {active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--primary)] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="md:hidden h-[76px]" />

      <style jsx global>{`
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </>
  );
}
