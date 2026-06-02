'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, Loader2, Newspaper, Bell, Tag, Shield, X, Heart } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import ContentBlockRenderer from '@/components/storefront/ContentBlockRenderer';
import RequestCarousel from '@/components/storefront/RequestCarousel';
import RequestSubmitForm from '@/components/storefront/RequestSubmitForm';

interface ContentBlock {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
  display_order: number;
  is_active: boolean;
}

export default function NewsletterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscribed, setSubscribed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setSubscribed(data.user?.newsletter_subscribed ?? true);
      } catch (err) {
        console.error('Failed to load user:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadUser();

    const loadBlocks = async () => {
      try {
        const res = await fetch('/api/content-blocks');
        if (!res.ok) throw new Error('Failed to load blocks');
        const data = await res.json();
        setBlocks(data);
      } catch (err) {
        console.error('Failed to load blocks:', err);
        setBlocks([]);
      } finally {
        setBlocksLoading(false);
      }
    };
    loadBlocks();
  }, [router]);

  const performUnsubscribe = async () => {
    setSaving(true);
    try {
      await fetch('/api/subscribe/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      setSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const performSubscribe = async () => {
    setSaving(true);
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterSubscribed: true }),
      });
      setSubscribed(true);
    } catch (error) {
      console.error('Failed to update subscription', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeClick = () => {
    setShowFeedback(true);
  };

  const submitFeedbackAndUnsubscribe = async () => {
    setSubmittingFeedback(true);
    try {
      await fetch('/api/subscribe/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          reason: feedbackReason,
          details: feedbackDetails,
        }),
      });
      setSubscribed(false);
      setShowFeedback(false);
      setFeedbackReason('');
      setFeedbackDetails('');
    } catch (err) {
      console.error('Unsubscribe failed', err);
      alert('Could not unsubscribe. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const toggleSubscription = async () => {
    if (subscribed) {
      handleUnsubscribeClick();
    } else {
      await performSubscribe();
    }
  };

  if (loading || blocksLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-gray-600" size={32} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Hero Carousel - Entry Point */}
          <div className="mb-16">
            <HeroCarousel />
          </div>

          {/* Community Wishlist Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#F97316]/10 px-4 py-2 rounded-full mb-4">
                <Heart size={18} className="text-[#F97316]" />
                <span className="text-sm font-medium text-[#F97316]">Community Driven</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Community Wishlist</h1>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Request products you want to see. Submit your ideas with images and descriptions. 
                Trending requests with high demand become reality.
              </p>
            </div>

            {/* Trending Requests Carousel */}
            <div className="mb-16">
              <RequestCarousel />
            </div>

            {/* Submit Request Form */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Your Request</h2>
                <p className="text-gray-500 text-sm mb-5">
                  Have a product in mind? Tell us what you want – upload reference images and describe your idea.
                  Our team will review it and if there's enough interest, we'll make it.
                </p>
                <RequestSubmitForm />
              </div>
            </div>
          </div>

          {/* Content Blocks - Dynamic, admin-managed (includes Inspiration Gallery) */}
          <div className="space-y-16">
            {blocks.map((block) => (
              <ContentBlockRenderer key={block.id} block={block} />
            ))}
          </div>

          {/* Newsletter Subscription - At the bottom */}
          <div className="max-w-3xl mx-auto mt-20">
            <div className="bg-white rounded-3xl shadow-xl border p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-[#F97316]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="text-[#F97316]" size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
                <p className="text-gray-600">
                  Get the latest anime merch drops and exclusive offers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Tag className="text-[#F97316]" size={20} />
                  <span className="text-sm font-medium">Early access to sales</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Bell className="text-[#F97316]" size={20} />
                  <span className="text-sm font-medium">Weekly anime news</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Shield className="text-[#F97316]" size={20} />
                  <span className="text-sm font-medium">Unsubscribe anytime</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-[#F97316]" size={24} />
                    <div>
                      <p className="font-medium">{user?.email || 'Your email'}</p>
                      <p className="text-sm text-gray-500">
                        {subscribed ? 'Subscribed' : 'Not subscribed'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleSubscription}
                    disabled={saving}
                    className={`px-6 py-2 rounded-full font-medium transition ${
                      subscribed
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-[#F97316] text-white hover:bg-[#e0650f]'
                    }`}
                  >
                    {saving ? <Loader2 className="animate-spin inline mr-1" size={18} /> : null}
                    {subscribed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                </div>
              </div>

              {subscribed && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl">
                  <CheckCircle size={20} />
                  <span>You're all set! Check your inbox for a welcome email.</span>
                </div>
              )}

              <div className="mt-4 text-center">
                <Link href="/newsletter/preferences" className="text-sm text-[#F97316] hover:underline inline-flex items-center gap-1">
                  Customize your preferences →
                </Link>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>We send about 2-4 emails per month. No spam, just quality content.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">We're sad to see you go</h3>
              <button onClick={() => setShowFeedback(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Please tell us why you're unsubscribing:</p>
            <select
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              className="w-full p-2 border rounded-lg mb-3"
            >
              <option value="">Select a reason...</option>
              <option>Too many emails</option>
              <option>Content not relevant</option>
              <option>Didn't sign up for this</option>
              <option>Other</option>
            </select>
            <textarea
              value={feedbackDetails}
              onChange={(e) => setFeedbackDetails(e.target.value)}
              placeholder="Optional: any additional feedback?"
              rows={3}
              className="w-full p-2 border rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedbackAndUnsubscribe}
                disabled={submittingFeedback}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 disabled:opacity-50"
              >
                {submittingFeedback ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Unsubscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
