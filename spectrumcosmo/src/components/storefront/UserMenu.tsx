// components/storefront/UserMenu.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Package, Heart, MapPin, Settings, LogOut } from 'lucide-react';
import { useUser } from '@/context/UserProvider';

export default function UserMenu() {
  const { user, setUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = async () => {
    try {
      // 1. Call logout API
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (res.ok) {
        // 2. Clear user from context
        setUser(null);
        
        // 3. Clear localStorage (keep cart for guest if desired)
        localStorage.removeItem('user_token');
        localStorage.removeItem('preferred_currency');
        // Optional: Clear cart on logout
        // localStorage.removeItem('spectrumcosmo_cart');
        
        // 4. Clear sessionStorage
        sessionStorage.clear();
        
        // 5. Close menu
        setMenuOpen(false);
        
        // 6. Redirect to home with refresh
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if API fails
      setUser(null);
      router.push('/');
      router.refresh();
    }
  };

  const closeMenu = () => setMenuOpen(false);

  if (!user) {
    return (
      <Link 
        href="/login" 
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
      >
        <User size={18} className="text-gray-600 dark:text-gray-400" />
      </Link>
    );
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const profileImage = user.profileImage;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors overflow-hidden"
        aria-label="User menu"
      >
        {profileImage ? (
          <Image src={profileImage} alt={displayName} width={32} height={32} className="w-full h-full object-cover" />
        ) : (
          <User size={18} className="text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-[9999]"
          style={{ top: '100%', right: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>

          <Link
            href="/account/profile"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-[#F97316] transition-colors"
          >
            <User size={16} /> My Profile
          </Link>
          <Link
            href="/account/orders"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-[#F97316] transition-colors"
          >
            <Package size={16} /> My Orders
          </Link>
          <Link
            href="/account/wishlist"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-[#F97316] transition-colors"
          >
            <Heart size={16} /> Wishlist
          </Link>
          <Link
            href="/account/addresses"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-[#F97316] transition-colors"
          >
            <MapPin size={16} /> Addresses
          </Link>
          <Link
            href="/account/settings"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-[#F97316] transition-colors"
          >
            <Settings size={16} /> Settings
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
          <button
            onClick={() => { logout(); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
