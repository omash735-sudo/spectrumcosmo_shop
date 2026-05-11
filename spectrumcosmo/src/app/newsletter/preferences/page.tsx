'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

export default function PreferencesPage() {
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState({ frequency: 'weekly', topics: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const emailParam = new URLSearchParams(window.location.search).get('email');
    if (emailParam) setEmail(emailParam);
  }, []);

  const save = async () => {
    setLoading(true);
    await fetch('/api/subscribe/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, preferences: prefs }),
    });
    alert('Preferences saved!');
    router.push('/');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Manage your newsletter preferences</h1>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <div className="mb-4">
            <label className="block font-medium">Frequency</label>
            <select value={prefs.frequency} onChange={(e) => setPrefs({ ...prefs, frequency: e.target.value })} className="w-full border p-2 rounded">
              <option>weekly</option>
              <option>biweekly</option>
              <option>monthly</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium">Topics you like</label>
            {['sales', 'new_arrivals', 'anime_news', 'exclusive'].map(t => (
              <label key={t} className="flex items-center gap-2">
                <input type="checkbox" checked={prefs.topics.includes(t)} onChange={(e) => {
                  setPrefs(prev => ({
                    ...prev,
                    topics: e.target.checked ? [...prev.topics, t] : prev.topics.filter(x => x !== t)
                  }));
                }} /> {t}
              </label>
            ))}
          </div>
          <button onClick={save} disabled={loading} className="bg-orange-500 text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
