'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Package, Heart, MapPin, Settings, LogOut } from 'lucide-react';

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => null);
  }, []);

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
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => setMenuOpen(false);

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#F97316]">
        <User size={16} />
        <span>Sign in</span>
      </Link>
    );
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const profileImage = user.profileImage;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#F97316]"
      >
        {profileImage ? (
          <Image src={profileImage} alt={displayName} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <User size={18} />
        )}
        <span>{displayName}</span>
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[9999]"
          style={{ top: '100%', right: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100 mb-2">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <Link
            href="/account/profile"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors"
          >
            <User size={16} /> My Profile
          </Link>
          <Link
            href="/account/orders"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors"
          >
            <Package size={16} /> My Orders
          </Link>
          <Link
            href="/account/wishlist"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors"
          >
            <Heart size={16} /> Wishlist
          </Link>
          <Link
            href="/account/addresses"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors"
          >
            <MapPin size={16} /> Addresses
          </Link>
          <Link
            href="/account/settings"
            onClick={closeMenu}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors"
          >
            <Settings size={16} /> Settings
          </Link>

          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => { logout(); closeMenu(); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
