'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, MapPin, DollarSign, Globe, Bell, Mail, Star, Shield, FileText, Trash2,
  Loader2, X, Star as StarIcon, FileCheck, Lock, KeyRound, Sparkles,
  ArrowLeft, CheckCircle, AlertCircle, CreditCard, Smartphone, Heart,
  ShoppingBag, LogOut, HelpCircle, MessageCircle
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import CurrencySelector from '@/components/storefront/CurrencySelector';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    };
    loadUser();
  }, [router]);

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
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Account deleted successfully');
        router.push('/');
      } else {
        toast.error('Failed to delete account');
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
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
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

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading settings...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const settingsSections = [
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/account" className="p-2 hover:bg-gray-100 rounded-full transition">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
                <Sparkles size={18} className="text-orange-400" />
              </div>
            </div>
            <p className="text-gray-500 text-sm ml-14">Manage your account preferences and security</p>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">{user?.name || user?.email?.split('@')[0]}</h2>
                <p className="text-orange-100 text-sm">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {settingsSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon size={18} className="text-orange-500" />
                  <h3 className="font-semibold text-gray-800 text-lg">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isDanger = item.danger;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (item.href) router.push(item.href);
                          if (item.action === 'rating') setShowRatingModal(true);
                          if (item.action === 'delete') setShowDeleteModal(true);
                          if (item.action === 'currency') {
                            document.getElementById('currency-selector-trigger')?.click();
                          }
                          if (item.action === 'password') setShowPasswordModal(true);
                        }}
                        className={`bg-white rounded-2xl border p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-200 group ${
                          isDanger ? 'hover:border-red-200' : 'hover:border-orange-200'
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${
                          isDanger ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                        } group-hover:scale-105 transition`}>
                          <Icon size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isDanger ? 'text-red-600' : 'text-gray-800'}`}>{item.label}</h4>
                          <p className="text-xs text-gray-400">{item.description}</p>
                          {item.value && <p className="text-xs text-gray-500 mt-1">{item.value}</p>}
                          {item.label === 'Currency' && <p className="text-xs text-orange-500 mt-1">{currency}</p>}
                        </div>
                        <ChevronRight size={16} className={`text-gray-400 group-hover:translate-x-1 transition ${isDanger ? 'group-hover:text-red-500' : 'group-hover:text-orange-500'}`} />
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
            <button id="currency-selector-trigger" onClick={() => {}} />
          </div>
        </div>
      </main>

      {/* Rating Modal - Premium */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Rate SpectrumCosmo</h3>
                <button onClick={() => setShowRatingModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Your feedback helps us improve</p>
            </div>
            <div className="p-6">
              <div className="flex justify-center gap-2 mb-4">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <StarIcon size={40} className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition`} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Share your experience (optional)..."
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
              />
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || ratingSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50"
              >
                {ratingSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal - Premium */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b bg-red-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
              <p className="text-sm text-red-500 mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">All your data, orders, wishlist, and profile information will be permanently deleted.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Type <code className="font-mono bg-white px-2 py-0.5 rounded text-sm font-bold">DELETE</code> to confirm
                </p>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type DELETE here"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal - Premium */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Create a strong password for your account</p>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50"
                >
                  {changingPassword ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Change Password'}
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

// Missing imports
import { Settings, ChevronRight } from 'lucide-react';
