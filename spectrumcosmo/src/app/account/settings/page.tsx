'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  User, MapPin, DollarSign, Globe, Bell, Mail, Star, Shield, FileText, Trash2,
  Loader2, X, Star as StarIcon, FileCheck, Lock, KeyRound, Sparkles,
  ArrowLeft, CheckCircle, AlertCircle, Heart,
  LogOut, HelpCircle, MessageCircle, Settings, ChevronRight,
  Sun, Moon, Monitor
} from 'lucide-react';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import CurrencySelector from '@/components/storefront/CurrencySelector';
import toast from 'react-hot-toast';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
};

type SettingsItem = {
  icon: any;
  label: string;
  href?: string;
  action?: 'password' | 'rating' | 'delete' | 'currency' | 'theme';
  description: string;
  value?: string;
  danger?: boolean;
};

type SettingsSection = {
  title: string;
  icon: any;
  items: SettingsItem[];
};

const DELETE_CONFIRM_TEXT = 'DELETE';
const MIN_PASSWORD_LENGTH = 8;

export default function SettingsPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // Modals removed for debugging

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        if (res.status === 401) {
          setAuthError(true);
          setUser(null);
          return;
        }
        throw new Error('Failed to load user');
      }
      const data = await res.json();
      setUser(data.user);
      setAuthError(false);
    } catch (err) {
      console.error('Failed to load user:', err);
      setAuthError(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleItemClick = (item: SettingsItem) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  const getThemeIcon = () => {
    if (!mounted) return Monitor;
    if (theme === 'dark') return Moon;
    if (theme === 'light') return Sun;
    return Monitor;
  };

  const getThemeDescription = () => {
    if (!mounted) return 'Loading...';
    if (theme === 'system') return 'Follows your device';
    return theme + ' mode';
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account Settings',
      icon: User,
      items: [
        { icon: User, label: 'Profile Information', href: '/account/profile', description: 'Manage your personal details' },
        { icon: MapPin, label: 'Addresses', href: '/account/addresses', description: 'Manage your shipping addresses' },
        { icon: Lock, label: 'Security', action: 'password', description: 'Change your password' },
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        { 
          icon: getThemeIcon(), 
          label: 'Theme', 
          action: 'theme', 
          description: `Current: ${getThemeDescription()}` 
        },
        { icon: DollarSign, label: 'Currency', action: 'currency', description: `Current: ${currency}` },
        { icon: Globe, label: 'Language', value: 'English', description: 'Select your preferred language' },
        { icon: Bell, label: 'Notifications', href: '/notification', description: 'Manage your alerts' },
        { icon: Mail, label: 'Newsletter', href: '/newsletter', description: 'Email preferences' },
      ]
    },
    {
      title: 'Support & Feedback',
      icon: Heart,
      items: [
        { icon: Star, label: 'Rate Us', action: 'rating', description: 'Share your experience' },
        { icon: HelpCircle, label: 'Help Center', href: '/faq', description: 'Get support' },
        { icon: MessageCircle, label: 'Contact Support', href: '/contact', description: 'Reach out to us' },
      ]
    },
    {
      title: 'Legal',
      icon: Shield,
      items: [
        { icon: Shield, label: 'Privacy Policy', href: '/privacy', description: 'Read our privacy policy' },
        { icon: FileCheck, label: 'Terms & Conditions', href: '/terms', description: 'Terms of service' },
        { icon: Trash2, label: 'Delete Account', action: 'delete', description: 'Permanently delete your account', danger: true },
      ]
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-10 h-10 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (authError || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Session Expired</h2>
            <p className="text-[var(--foreground-muted)] mb-4">Please log in again to access your settings.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2 rounded-xl transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] py-4 sm:py-6 md:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-1 sm:mb-2">
            <Link href="/account" className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-full transition min-h-[36px] min-w-[36px] flex items-center justify-center">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-4 sm:h-5 md:h-6 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Settings</h1>
              <Sparkles size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 text-[var(--primary)]" />
            </div>
          </div>
          <p className="text-[var(--foreground-muted)] text-xs sm:text-sm ml-8 sm:ml-10 md:ml-14">Manage your account preferences and security</p>
        </div>

        {/* User Banner */}
        <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-4 sm:mb-6 md:mb-8">
          <div className="relative z-10 bg-[var(--primary)] p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-white sm:w-7 sm:h-7 md:w-8 md:h-8" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{user?.name || user?.email?.split('@')[0]}</h2>
                <p className="text-orange-100 text-xs sm:text-sm truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] flex-shrink-0"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-5 sm:space-y-6 md:space-y-8">
          {settingsSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 md:mb-4">
                <section.icon size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px] text-[var(--primary)]" />
                <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base md:text-lg">{section.title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  const isDanger = item.danger || false;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleItemClick(item)}
                      className={`bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-3 sm:p-4 md:p-5 flex items-center gap-2.5 sm:gap-3 md:gap-4 cursor-pointer hover:shadow-md transition-all duration-200 group ${
                        isDanger 
                          ? 'hover:border-red-300 dark:hover:border-red-700' 
                          : 'hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0 transition group-hover:scale-105 ${
                        isDanger 
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                          : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      }`}>
                        <Icon size={16} className="sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-xs sm:text-sm md:text-base truncate ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-[var(--foreground)]'}`}>
                          {item.label}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] line-clamp-1 sm:line-clamp-2">{item.description}</p>
                      </div>
                      <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px] text-[var(--foreground-muted)] group-hover:translate-x-1 transition flex-shrink-0 ${
                        isDanger ? 'group-hover:text-red-500' : 'group-hover:text-[var(--primary)]'
                      }`} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden">
          <CurrencySelector />
          <button id="currency-selector-trigger" onClick={() => {}} aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
