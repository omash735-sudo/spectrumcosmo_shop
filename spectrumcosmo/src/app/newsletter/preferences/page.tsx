'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Bell, Tag, Zap, Star, Save, CheckCircle } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

type Preferences = {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  topics: string[];
  promotions: boolean;
  product_alerts: boolean;
  anime_news: boolean;
};

export default function PreferencesPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [prefs, setPrefs] = useState<Preferences>({
    frequency: 'weekly',
    topics: [],
    promotions: true,
    product_alerts: true,
    anime_news: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const emailParam = new URLSearchParams(window.location.search).get('email');
    if (emailParam) setEmail(emailParam);

    const loadUserAndPrefs = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            setEmail(data.user.email);
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUserAndPrefs();
  }, []);

  const savePreferences = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/subscribe/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, preferences: prefs }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const topicOptions = [
    { id: 'sales', label: 'Sales & Discounts', icon: Tag },
    { id: 'new_arrivals', label: 'New Arrivals', icon: Zap },
    { id: 'anime_news', label: 'Anime News', icon: Star },
    { id: 'exclusive', label: 'Exclusive Drops', icon: Bell },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Loader2 className="animate-spin text-[#F97316]" size={32} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-900 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#F97316]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-[#F97316]" size={28} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Preferences</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Customize what you receive and how often
              </p>
            </div>

            <div className="space-y-6">
              {/* Email Display */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <p className="text-gray-900 dark:text-white font-medium">{email || 'Not set'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {user ? 'Logged in as ' + user.name : 'Changes apply to this email'}
                </p>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setPrefs({ ...prefs, frequency: freq })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                        prefs.frequency === freq
                          ? 'bg-[#F97316] text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics You Like</label>
                <div className="space-y-2">
                  {topicOptions.map((topic) => {
                    const Icon = topic.icon;
                    const isSelected = prefs.topics.includes(topic.id);
                    return (
                      <label
                        key={topic.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected 
                            ? 'border-[#F97316] bg-orange-50 dark:bg-orange-950/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrefs({ ...prefs, topics: [...prefs.topics, topic.id] });
                            } else {
                              setPrefs({ ...prefs, topics: prefs.topics.filter(t => t !== topic.id) });
                            }
                          }}
                          className="w-4 h-4 text-[#F97316] rounded focus:ring-[#F97316]"
                        />
                        <Icon size={18} className="text-[#F97316]" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{topic.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Promotions & Offers</span>
                  <button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, promotions: !prefs.promotions })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      prefs.promotions ? 'bg-[#F97316]' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        prefs.promotions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Alerts</span>
                  <button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, product_alerts: !prefs.product_alerts })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      prefs.product_alerts ? 'bg-[#F97316]' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        prefs.product_alerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Anime News & Updates</span>
                  <button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, anime_news: !prefs.anime_news })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      prefs.anime_news ? 'bg-[#F97316]' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        prefs.anime_news ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Save Button */}
              <button
                onClick={savePreferences}
                disabled={saving}
                className="w-full bg-[#F97316] text-white py-3 rounded-xl font-medium hover:bg-[#e0650f] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : saved ? (
                  <>
                    <CheckCircle size={18} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Preferences
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                You can change these preferences anytime. Unsubscribe link in every email.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
