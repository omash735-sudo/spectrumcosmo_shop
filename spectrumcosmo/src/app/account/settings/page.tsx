'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  User, Lock, Moon, Bell, Mail,
  HelpCircle, MessageCircle, Shield, FileText,
  Trash2, ArrowLeft, Sparkles, LogOut, Settings,
  ChevronRight, Sun, Monitor
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import ThemeSwitcher from '@/components/ThemeSwitcher';

type User = {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
};

type SettingsItem = {
  icon: any;
  label: string;
  href?: string;
  desc: string;
  danger?: boolean;
  action?: 'theme' | 'logout';
};

type SettingsSection = {
  title: string;
  icon: any;
  items: SettingsItem[];
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const getThemeIcon = () => {
    if (!mounted) return Monitor;
    if (theme === 'dark') return Moon;
    if (theme === 'light') return Sun;
    return Monitor;
  };

  const getThemeLabel = () => {
    if (!mounted) return 'Loading...';
    if (theme === 'dark') return 'Dark';
    if (theme === 'light') return 'Light';
    return 'System';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="animate-pulse text-[var(--foreground-muted)]">Loading...</div>
        </main>
      </>
    );
  }

  const sections: SettingsSection[] = [
    {
      title: 'My Profile',
      icon: User,
      items: [
        { icon: User, label: 'My Profile', href: '/account/profile', desc: 'Manage your personal details' },
        { icon: Lock, label: 'Security', href: '/account/security', desc: 'Change your password' },
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        { 
          icon: getThemeIcon(), 
          label: 'Theme', 
          desc: `Current: ${getThemeLabel()}`,
          action: 'theme'
        },
        { icon: Bell, label: 'Notifications', href: '/notification', desc: 'Manage your alerts' },
        { icon: Mail, label: 'Newsletter', href: '/newsletter', desc: 'Email preferences' },
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        { icon: HelpCircle, label: 'Help Center', href: '/faq', desc: 'Get support' },
        { icon: MessageCircle, label: 'Contact Support', href: '/contact', desc: 'Reach out to us' },
      ]
    },
    {
      title: 'Legal',
      icon: Shield,
      items: [
        { icon: Shield, label: 'Privacy Policy', href: '/privacy', desc: 'Read our privacy policy' },
        { icon: FileText, label: 'Terms & Conditions', href: '/terms', desc: 'Terms of service' },
        { icon: Trash2, label: 'Delete Account', href: '/account/delete', desc: 'Permanently delete your account', danger: true },
      ]
    },
  ];

  const handleThemeClick = () => {
    const themeBtn = document.querySelector('[aria-label="Change theme"]') as HTMLButtonElement;
    if (themeBtn) themeBtn.click();
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Link href="/account" className="p-2 hover:bg-[var(--background-secondary)] rounded-full transition min-h-[40px] min-w-[40px] flex items-center justify-center">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-5 sm:h-6 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">Settings</h1>
              <Sparkles size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 text-[var(--primary)]" />
            </div>
          </div>

          {/* User Banner - Manga Style */}
          <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-4 sm:mb-6 md:mb-8">
            <div className="relative z-10 bg-[var(--primary)]/90 backdrop-blur-sm p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-orange-100 text-xs sm:text-sm truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 md:mb-4">
                  <section.icon size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px] text-[var(--primary)]" />
                  <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base md:text-lg">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {section.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isDanger = item.danger || false;
                    
                    if (item.action === 'theme') {
                      return (
                        <div
                          key={idx}
                          onClick={handleThemeClick}
                          className={`bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-3 sm:p-4 md:p-5 flex items-center gap-2.5 sm:gap-3 md:gap-4 cursor-pointer hover:shadow-md transition-all duration-200 group hover:border-[var(--primary)]/30`}
                        >
                          <div className="p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0 transition group-hover:scale-105 bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Icon size={16} className="sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs sm:text-sm md:text-base truncate text-[var(--foreground)]">
                              {item.label}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{item.desc}</p>
                          </div>
                          <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px] text-[var(--foreground-muted)] group-hover:translate-x-1 transition flex-shrink-0 group-hover:text-[var(--primary)]" />
                        </div>
                      );
                    }
                    
                    return (
                      <Link
                        key={idx}
                        href={item.href || '#'}
                        className={`bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-3 sm:p-4 md:p-5 flex items-center gap-2.5 sm:gap-3 md:gap-4 hover:shadow-md transition-all duration-200 group ${
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
                          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] line-clamp-1 sm:line-clamp-2">{item.desc}</p>
                        </div>
                        <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px] text-[var(--foreground-muted)] group-hover:translate-x-1 transition flex-shrink-0 ${
                          isDanger ? 'group-hover:text-red-500' : 'group-hover:text-[var(--primary)]'
                        }`} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Sign Out Card - Last Item */}
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 md:mb-4">
                <LogOut size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px] text-[var(--foreground-muted)]" />
                <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base md:text-lg">Account</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div
                  onClick={handleLogout}
                  className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-3 sm:p-4 md:p-5 flex items-center gap-2.5 sm:gap-3 md:gap-4 cursor-pointer hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 group"
                >
                  <div className="p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0 transition group-hover:scale-105 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                    <LogOut size={16} className="sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm md:text-base truncate text-red-600 dark:text-red-400">
                      Sign Out
                    </h4>
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Sign out of your account</p>
                  </div>
                  <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px] text-[var(--foreground-muted)] group-hover:translate-x-1 transition flex-shrink-0 group-hover:text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ThemeSwitcher component - hidden trigger */}
      <div className="hidden">
        <ThemeSwitcher />
      </div>
    </>
  );
}
