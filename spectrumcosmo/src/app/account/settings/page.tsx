'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  User, MapPin, Lock, Moon, Bell, Mail,
  HelpCircle, MessageCircle, Shield, FileText,
  Trash2, ArrowLeft, Sparkles, LogOut, Settings,
  Sun, Monitor, X, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import toast from 'react-hot-toast';

const DELETE_CONFIRM_TEXT = 'DELETE';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Theme Modal State
  const [showThemeModal, setShowThemeModal] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRM_TEXT) {
      toast.error(`Please type ${DELETE_CONFIRM_TEXT} to confirm`);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Account deleted successfully');
        router.push('/');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete account');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setDeleting(false);
    }
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
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[var(--foreground-muted)] text-sm">Loading settings...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const sections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { icon: User, label: 'Profile', href: '/account/profile', desc: 'Manage your personal details' },
        { icon: MapPin, label: 'Addresses', href: '/account/addresses', desc: 'Manage your shipping addresses' },
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
        { 
          icon: Trash2, 
          label: 'Delete Account', 
          desc: 'Permanently delete your account',
          danger: true,
          action: 'delete'
        },
      ]
    },
  ];

  const handleItemClick = (item: any) => {
    if (item.action === 'theme') {
      setShowThemeModal(true);
    } else if (item.action === 'delete') {
      setShowDeleteModal(true);
    } else if (item.href) {
      router.push(item.href);
    }
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
                          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] line-clamp-1 sm:line-clamp-2">{item.desc}</p>
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
        </div>
      </main>

      {/* Theme Modal */}
      {showThemeModal && mounted && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowThemeModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 md:p-6 border-b border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">Choose your theme</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-muted)] mt-0.5">
                    {theme === 'system' ? 'Currently following your device' : `Currently in ${theme} mode`}
                  </p>
                </div>
                <button onClick={() => setShowThemeModal(false)} className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center">
                  <X size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-[var(--foreground-muted)]" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3">
              <button
                onClick={() => { setTheme('light'); setShowThemeModal(false); }}
                className={`w-full p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex items-center gap-2.5 sm:gap-3 md:gap-4 ${
                  theme === 'light'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
                  <Sun size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base">Light Mode</h4>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Bright and clean</p>
                </div>
                {theme === 'light' && <CheckCircle size={16} className="text-[var(--primary)] flex-shrink-0" />}
              </button>

              <button
                onClick={() => { setTheme('dark'); setShowThemeModal(false); }}
                className={`w-full p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex items-center gap-2.5 sm:gap-3 md:gap-4 ${
                  theme === 'dark'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-gray-800 dark:bg-gray-700 flex-shrink-0">
                  <Moon size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base">Dark Mode</h4>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Easy on the eyes</p>
                </div>
                {theme === 'dark' && <CheckCircle size={16} className="text-[var(--primary)] flex-shrink-0" />}
              </button>

              <button
                onClick={() => { setTheme('system'); setShowThemeModal(false); }}
                className={`w-full p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex items-center gap-2.5 sm:gap-3 md:gap-4 ${
                  theme === 'system'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                  <Monitor size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base">System Default</h4>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Follow your device</p>
                </div>
                {theme === 'system' && <CheckCircle size={16} className="text-[var(--primary)] flex-shrink-0" />}
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 border-t border-[var(--border)] bg-[var(--background-secondary)] rounded-b-xl sm:rounded-b-2xl">
              <p className="text-[10px] sm:text-xs text-center text-[var(--foreground-muted)]">
                Your preference is saved automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 md:p-6 border-b bg-red-50 dark:bg-red-950/30 rounded-t-xl sm:rounded-t-2xl border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-600 dark:text-red-400">Delete Account</h3>
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm text-red-500 dark:text-red-500 mt-0.5">This action cannot be undone</p>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <p className="text-xs sm:text-sm md:text-base text-[var(--foreground-muted)] mb-3 sm:mb-4">
                All your data, orders, wishlist, and profile information will be permanently deleted.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs md:text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-1.5 sm:gap-2">
                  <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                  Type <code className="font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">DELETE</code> to confirm
                </p>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg px-3 py-2 sm:px-4 sm:py-3 mb-3 sm:mb-4 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[44px]"
                placeholder="Type DELETE here"
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} 
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== DELETE_CONFIRM_TEXT || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-xs sm:text-sm min-h-[44px]"
                >
                  {deleting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

// Import missing icons
import { ChevronRight } from 'lucide-react';
