'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from './CartProvider';
import { useUser } from './UserProvider';

type NavItem = {
  name: 'Home' | 'Search' | 'Cart' | 'Account';
  href: string;
  icon: typeof Home;
  // Route prefixes (without query) that make this tab active.
  // `exact: true` means only that exact path, not nested routes.
  match: { paths: string[]; exact?: boolean };
};

// ---------------------------------------------------------------
// Destinations
//
// Home    → /                       exact match only
// Search  → /products?focus=search  active on /products and nested routes
// Cart    → /cart                   active on /cart ONLY (exact), so
//                                   /cart/success does not highlight it
// Account → /account                active on /account and nested routes
//
// The Search tab reuses the /products search surface. It appends
// `focus=search`, which the products page reads to hide promo blocks
// and autofocus the input. LayoutWrapper suppresses the shell-level
// MobileSearchBar on /products so only one search input is shown.
// ---------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  { name: 'Home',    href: '/',                      icon: Home,         match: { paths: ['/'], exact: true } },
  { name: 'Search',  href: '/products?focus=search', icon: Search,       match: { paths: ['/products'] } },
  { name: 'Cart',    href: '/cart',                  icon: ShoppingCart, match: { paths: ['/cart'], exact: true } },
  { name: 'Account', href: '/account',               icon: User,         match: { paths: ['/account'] } },
];

// Segment-safe: "/cart" matches "/cart" and "/cart/x", but never "/cartoon".
function matchesPath(pathname: string, base: string, exact?: boolean) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (clean === base) return true;
  if (exact || base === '/') return false;
  return clean.startsWith(base + '/');
}

// True when the focused element opens the on-screen keyboard.
function isTextEntry(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'file', 'image', 'color'].includes(type);
  }
  return (el as HTMLElement).isContentEditable === true;
}

export default function MobileBottomNav() {
  const pathname = usePathname() || '';
  const { totalItems } = useCart();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reset the avatar error state if the profile image changes.
  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.profileImage]);

  // Hide the dock while a text field is focused (keyboard open), so it
  // can never sit on top of the input, a submit button or checkout
  // controls. focusout is deferred one tick so moving focus from one
  // field to another does not flicker the dock.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onFocusIn = (e: FocusEvent) => {
      if (timer) clearTimeout(timer);
      setTyping(isTextEntry(e.target as Element | null));
    };
    const onFocusOut = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setTyping(isTextEntry(document.activeElement)), 50);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const isActive = (item: NavItem) =>
    item.match.paths.some((p) => matchesPath(pathname, p, item.match.exact));

  const avatarSrc = user?.profileImage || '';

  return (
    <>
      {/* ------------------------------------------------------------
          Floating navigation dock.

          - Fixed, centered, max 400px wide.
          - Bottom offset = max(safe-area-inset-bottom, 16px).
          - Wrapper is pointer-events-none so it never blocks content;
            the pill itself is pointer-events-auto.
          - Hidden (and non-interactive) while a text field is focused.
         ------------------------------------------------------------ */}
      <div
        className={clsx(
          'fixed left-0 right-0 z-50 flex justify-center px-4 pointer-events-none',
          'transition-all duration-150',
          typing && 'opacity-0 translate-y-4 invisible'
        )}
        style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        aria-hidden={typing || undefined}
      >
        <nav
          aria-label="Primary"
          className={clsx(
            'pointer-events-auto flex items-center justify-around',
            'w-full max-w-[400px] h-[64px] px-1.5',
            'bg-[var(--background-card)]',
            'border border-[var(--border)]',
            'rounded-full',
            'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]'
          )}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const showBadge = item.name === 'Cart' && totalItems > 0;
            const showAvatar =
              item.name === 'Account' && mounted && !!avatarSrc && !avatarFailed;

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
                tabIndex={typing ? -1 : undefined}
                className={clsx(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'flex-1 h-full rounded-full',
                  'transition-colors duration-150',
                  active
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                )}
              >
                <div className="relative flex items-center justify-center w-6 h-6">
                  {showAvatar ? (
                    // Plain <img>: profile photos can come from any host,
                    // and next/image would reject hosts missing from
                    // images.remotePatterns (and is unoptimised under
                    // `output: 'export'` anyway). Falls back to the icon
                    // if the image fails to load.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt={user?.name || 'Account'}
                      width={22}
                      height={22}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className={clsx(
                        'w-[22px] h-[22px] rounded-full object-cover',
                        active &&
                          'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--background-card)]'
                      )}
                    />
                  ) : (
                    <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  )}

                  {showBadge && (
                    <span
                      className={clsx(
                        'absolute -top-1 -right-2',
                        'bg-[var(--primary)] text-white',
                        'text-[9px] font-bold leading-none',
                        'min-w-[16px] h-4 px-1 rounded-full',
                        'flex items-center justify-center'
                      )}
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </div>

                <span
                  className={clsx(
                    'text-[10px] leading-none font-medium tracking-tight',
                    active
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--foreground-muted)]'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer: reserves room at the END of normal page flow so the last
          content is not hidden behind the dock. Height =
            bottom offset (max(safe-area, 16px)) + pill (64px) + air (16px).
          It stays constant while typing so the page does not jump.
          It does NOT help pages that scroll inside their own container;
          those need their own bottom padding (see notes). */}
      <div
        aria-hidden="true"
        style={{
          height: 'calc(80px + max(env(safe-area-inset-bottom, 0px), 16px))',
        }}
      />
    </>
  );
}
