'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, MapPin, Lock, Moon, DollarSign, Bell, Mail, 
  Star, HelpCircle, MessageCircle, Shield, FileText, 
  Trash2, ArrowLeft, Sparkles, LogOut, Settings
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data?.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="animate-pulse text-[var(--foreground-muted)]">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', href: '/account/profile', desc: 'Manage your personal details' },
        { icon: MapPin, label: 'Addresses', href: '/account/addresses', desc: 'Manage your shipping addresses' },
        { icon: Lock, label: 'Security', href: '/account/security', desc: 'Change your password' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Theme', href: '/account/theme', desc: 'Choose your preferred theme' },
        { icon: DollarSign, label: 'Currency', href: '/account/currency', desc: 'Select your currency' },
        { icon: Bell, label: 'Notifications', href: '/notification', desc: 'Manage your alerts' },
        { icon: Mail, label: 'Newsletter', href: '/newsletter', desc: 'Email preferences' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', href: '/faq', desc: 'Get support' },
        { icon: MessageCircle, label: 'Contact Support', href: '/contact', desc: 'Reach out to us' },
        { icon: Star, label: 'Rate Us', href: '/account/rate', desc: 'Share your experience' },
      ]
    },
    {
      title: 'Legal',
      items: [
        { icon: Shield, label: 'Privacy Policy', href: '/privacy', desc: 'Read our privacy policy' },
        { icon: FileText, label: 'Terms & Conditions', href: '/terms', desc: 'Terms of service' },
        { icon: Trash2, label: 'Delete Account', href: '/account/delete', desc: 'Permanently delete your account', danger: true },
      ]
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/account" className="p-2 hover:bg-[var(--background-secondary)] rounded-full transition">
              <ArrowLeft size={20} className="text-[var(--foreground-muted)]" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
            <Sparkles size={16} className="text-[var(--primary)]" />
          </div>

          {/* User Banner */}
          <div className="bg-[var(--primary)] rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-white font-bold">{user?.name || 'User'}</h2>
                <p className="text-orange-100 text-sm">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition"
              >
                <LogOut size={16} className="inline mr-1" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Settings Grid */}
          {sections.map((section, i) => (
            <div key={i} className="mb-6">
              <h3 className="font-semibold text-[var(--foreground)] mb-3">{section.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.map((item, j) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={j}
                      href={item.href}
                      className={`bg-[var(--background-card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition group ${
                        item.danger ? 'hover:border-red-300' : 'hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${item.danger ? 'bg-red-50 text-red-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${item.danger ? 'text-red-500' : 'text-[var(--foreground)]'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
