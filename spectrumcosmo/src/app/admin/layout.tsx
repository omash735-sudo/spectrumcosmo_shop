'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Star,
  CreditCard,
  Truck,
  Users,
  TrendingUp,
  Mail,
  Settings,
  Menu,
  X,
  LogOut,
  Layout,        // Hero icon
  FileText,      // About Page icon
} from 'lucide-react';
import Image from 'next/image';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, section: 'CORE' },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, section: 'CORE' },
  { name: 'Products', href: '/admin/products', icon: Package, section: 'CORE' },
  { name: 'Reviews', href: '/admin/reviews', icon: Star, section: 'CORE' },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard, section: 'OPERATIONS' },
  { name: 'Delivery', href: '/admin/delivery', icon: Truck, section: 'OPERATIONS' },
  { name: 'Customers', href: '/admin/customers', icon: Users, section: 'OPERATIONS' },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, section: 'GROWTH' },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail, section: 'GROWTH' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, section: 'SYSTEM' },
  { name: 'Hero', href: '/admin/hero', icon: Layout, section: 'SYSTEM' },
  { name: 'About Page', href: '/admin/about', icon: FileText, section: 'SYSTEM' }, // NEW
  // Add Contact Page later if needed
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="relative w-10 h-10">
          <img
            src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
            alt="SpectrumCosmo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">SpectrumCosmo</h1>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {['CORE', 'OPERATIONS', 'GROWTH', 'SYSTEM'].map((section) => (
          <div key={section}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-2">
              {section}
            </p>
            {navItems
              .filter((item) => item.section === section)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
                    isActive(item.href)
                      ? 'bg-[#F97316] text-white shadow-md shadow-orange-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                  {isActive(item.href) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70"></span>
                  )}
                </Link>
              ))}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="pt-4 mt-4 border-t border-gray-100">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-gray-800">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85%] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <NavContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0 flex flex-col p-5 shadow-sm">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Main Content (with top padding for header) */}
      <div className="md:hidden pt-16">
        <main className="p-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
