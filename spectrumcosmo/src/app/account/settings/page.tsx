'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, MapPin, DollarSign, Globe, Bell, Mail, Star, Shield, FileText, Trash2,
  Loader2, X, Star as StarIcon, FileCheck, Lock, KeyRound, Sparkles,
  ArrowLeft, CheckCircle, AlertCircle, Heart,
  LogOut, HelpCircle, MessageCircle, Settings, ChevronRight,
  Sun, Moon, Monitor
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import CurrencySelector from '@/components/storefront/CurrencySelector';
import toast from 'react-hot-toast';

// Types
type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
};

type Theme = 'light' | 'dark' | 'system';

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

// Constants
const DELETE_CONFIRM_TEXT = 'DELETE';
const MIN_PASSWORD_LENGTH = 8;

export default function SettingsPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<Theme>('system');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Theme functions
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setShowThemeModal(false);
    toast.success(`${newTheme === 'system' ? 'System preference' : newTheme + ' mode'} activated`);
  };

  // Load user
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

  // Load theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('system');
    }
  }, [applyTheme]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as Theme;
      if (currentTheme === 'system' || !currentTheme) {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, applyTheme]);

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setRatingSubmitting(true);
    try {
      await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars: rating, comment: ratingComment })
      });
      toast.success('Thank you for your rating!');
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
    } catch (err) {
      toast.error('Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    
    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Password changed successfully');
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('Something went wrong');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleItemClick = (item: SettingsItem) => {
    if (item.href) {
      router.push(item.href);
    }
    if (item.action === 'rating') {
      setShowRatingModal(true);
    }
    if (item.action === 'delete') {
      setShowDeleteModal(true);
    }
    if (item.action === 'currency') {
      document.getElementById('currency-selector-trigger')?.click();
    }
    if (item.action === 'password') {
      setShowPasswordModal(true);
    }
    if (item.action === 'theme') {
      setShowThemeModal(true);
    }
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return Moon;
    if (theme === 'light') return Sun;
    return Monitor;
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
          description: `Current: ${theme === 'system' ? 'Follows your device' : theme + ' mode'}` 
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

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Auth error state
  if (authError || !user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Session Expired</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in again to access your settings.</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl transition w-full sm:w-auto"
              >
                Go to Login
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <Link href="/account" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 sm:h-6 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <Sparkles size={16} className="text-orange-400 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm ml-10 sm:ml-14">Manage your account preferences and security</p>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-bold text-white">{user?.name || user?.email?.split('@')[0]}</h2>
                <p className="text-orange-100 text-xs sm:text-sm">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition text-sm"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6 sm:space-y-8">
            {settingsSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <section.icon size={16} className="text-orange-500 sm:w-[18px] sm:h-[18px]" />
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base sm:text-lg">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {section.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isDanger = item.danger || false;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleItemClick(item)}
                        className={`bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-all duration-200 group ${
                          isDanger 
                            ? 'hover:border-red-200 dark:hover:border-red-800' 
                            : 'hover:border-orange-200 dark:hover:border-orange-800'
                        }`}
                      >
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${
                          isDanger 
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                            : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                        } group-hover:scale-105 transition`}>
                          <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm sm:text-base truncate ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {item.label}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{item.description}</p>
                        </div>
                        <ChevronRight size={14} className={`text-gray-400 group-hover:translate-x-1 transition flex-shrink-0 ${
                          isDanger ? 'group-hover:text-red-500' : 'group-hover:text-orange-500'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Hidden Currency Selector Trigger */}
          <div className="hidden">
            <CurrencySelector />
            <button id="currency-selector-trigger" onClick={() => {}} aria-hidden="true" />
          </div>
        </div>
      </main>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowThemeModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b dark:border-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Choose your theme</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {theme === 'system' ? 'Currently following your device preference' : `Currently in ${theme} mode`}
                  </p>
                </div>
                <button onClick={() => setShowThemeModal(false)} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                  <X size={18} className="text-gray-500 dark:text-gray-400 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex items-center gap-3 sm:gap-4 ${
                  theme === 'light'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
                  <Sun size={18} className="text-yellow-600 dark:text-yellow-400 sm:w-6 sm:h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Light Mode</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bright and clean interface</p>
                </div>
                {theme === 'light' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 flex-shrink-0"></div>}
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex items-center gap-3 sm:gap-4 ${
                  theme === 'dark'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-gray-800 dark:bg-gray-700 flex-shrink-0">
                  <Moon size={18} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Dark Mode</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes at night</p>
                </div>
                {theme === 'dark' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 flex-shrink-0"></div>}
              </button>

              <button
                onClick={() => handleThemeChange('system')}
                className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex items-center gap-3 sm:gap-4 ${
                  theme === 'system'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                  <Monitor size={18} className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">System Default</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Follow your device settings</p>
                </div>
                {theme === 'system' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 flex-shrink-0"></div>}
              </button>
            </div>

            <div className="p-4 sm:p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl sm:rounded-b-2xl">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Your preference is saved automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b dark:border-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Rate SpectrumCosmo</h3>
                <button onClick={() => setShowRatingModal(false)} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Your feedback helps us improve</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex justify-center gap-1.5 sm:gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <StarIcon size={28} className={`sm:w-10 sm:h-10 ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'} transition`} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 mb-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Share your experience (optional)..."
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
              />
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || ratingSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 text-sm sm:text-base"
              >
                {ratingSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b bg-red-50 dark:bg-red-950/30 rounded-t-xl sm:rounded-t-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">Delete Account</h3>
              <p className="text-xs sm:text-sm text-red-500 dark:text-red-500 mt-1">This action cannot be undone</p>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">All your data, orders, wishlist, and profile information will be permanently deleted.</p>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Type <code className="font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-bold">DELETE</code> to confirm
                </p>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-3 mb-4 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type DELETE here"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== DELETE_CONFIRM_TEXT || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-sm"
                >
                  {deleting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b dark:border-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Create a strong password for your account</p>
            </div>
            <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Minimum {MIN_PASSWORD_LENGTH} characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {passwordError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-2.5 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-2.5 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <p className="text-xs text-green-600 dark:text-green-400">{passwordSuccess}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 text-sm"
                >
                  {changingPassword ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
