'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, CheckCircle, Loader2, Newspaper, Bell, Tag, Shield, X, Heart, 
  Sparkles, ArrowRight, Star, Users, TrendingUp, Clock, Gift, 
  Zap, Send, BookOpen, Crown, Rocket, Award
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import ContentBlockRenderer from '@/components/storefront/ContentBlockRenderer';
import RequestCarousel from '@/components/storefront/RequestCarousel';
import RequestSubmitForm from '@/components/storefront/RequestSubmitForm';
import toast from 'react-hot-toast';

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
  const [emailInput, setEmailInput] = useState('');

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
        setEmailInput(data.user?.email || '');
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
        setBlocks(Array.isArray(data) ? data : []);
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
      toast.success('Unsubscribed from newsletter');
    } catch (error) {
      console.error('Failed to unsubscribe', error);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const performSubscribe = async (email: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSubscribed(true);
        toast.success('Successfully subscribed');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Failed to subscribe', error);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async () => {
    if (!emailInput.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    await performSubscribe(emailInput);
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
      toast.success('Unsubscribed successfully');
    } catch (err) {
      console.error('Unsubscribe failed', err);
      toast.error('Could not unsubscribe');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const toggleSubscription = async () => {
    if (subscribed) {
      handleUnsubscribeClick();
    } else {
      await performSubscribe(user?.email || emailInput);
    }
  };

  if (loading || blocksLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-600 to-orange-500 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-white text-sm font-medium">Join Our Community</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                The SpectrumCosmo
              </h1>
              <p className="text-3xl lg:text-5xl font-bold text-yellow-200 mb-6">
                Newsletter
              </p>
              <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
                Get the latest anime merch drops, exclusive offers, and community updates delivered to your inbox.
              </p>
              
              {/* Subscribe Form */}
              <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-5 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={saving}
                  className="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all inline-flex items-center gap-2 justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Subscribe
                </button>
              </div>
              <p className="text-white/70 text-xs mt-4">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full mb-4">
              <Award size={14} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-600">Why Subscribe</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">What You'll Get</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Exclusive benefits for our newsletter subscribers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap size={28} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Early Access</h3>
              <p className="text-gray-500 text-sm">Be the first to know about new drops and restocks before everyone else.</p>
            </div>
            <div className="group bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Gift size={28} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Exclusive Discounts</h3>
              <p className="text-gray-500 text-sm">Get subscriber-only promo codes and special offers.</p>
            </div>
            <div className="group bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Crown size={28} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">VIP Treatment</h3>
              <p className="text-gray-500 text-sm">Exclusive content, giveaways, and community events.</p>
            </div>
          </div>
        </div>

        {/* Community Wishlist Section */}
        <div className="bg-gradient-to-br from-orange-50/30 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full mb-4">
                <Heart size={18} className="text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Community Driven</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Community Wishlist</h2>
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
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Your Request</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Have a product in mind? Tell us what you want – upload reference images and describe your idea.
                  Our team will review it and if there's enough interest, we'll make it.
                </p>
                <RequestSubmitForm />
              </div>
            </div>
          </div>
        </div>

        {/* Content Blocks - Dynamic */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
          {blocks.map((block) => (
            <ContentBlockRenderer key={block.id} block={block} />
          ))}
        </div>

        {/* Newsletter Subscription Card */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={40} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Stay Updated</h2>
              <p className="text-orange-100 mb-8 max-w-md mx-auto">
                Get the latest anime merch drops and exclusive offers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl text-white">
                  <Rocket size={18} />
                  <span className="text-sm font-medium">Early access</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl text-white">
                  <Tag size={18} />
                  <span className="text-sm font-medium">Exclusive offers</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl text-white">
                  <Shield size={18} />
                  <span className="text-sm font-medium">Unsubscribe anytime</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Mail size={24} className="text-white" />
                    <div>
                      <p className="font-medium text-white">{user?.email || 'Your email'}</p>
                      <p className="text-sm text-orange-200">
                        {subscribed ? 'Subscribed' : 'Not subscribed'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleSubscription}
                    disabled={saving}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 ${
                      subscribed
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white text-orange-600 hover:bg-gray-100'
                    } disabled:opacity-50 shadow-md`}
                  >
                    {saving ? <Loader2 className="animate-spin inline mr-1" size={18} /> : null}
                    {subscribed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                </div>
              </div>

              {subscribed && (
                <div className="mt-6 flex items-center justify-center gap-2 text-white bg-green-500/20 py-2 px-4 rounded-full max-w-xs mx-auto">
                  <CheckCircle size={16} />
                  <span className="text-sm">Subscribed. Check your inbox.</span>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link href="/newsletter/preferences" className="text-sm text-white/80 hover:text-white underline inline-flex items-center gap-1">
                  Customize your preferences <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFeedback(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">We're sad to see you go</h3>
                <button onClick={() => setShowFeedback(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Help us improve by sharing your reason</p>
            </div>
            <div className="p-6">
              <select
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-orange-500"
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
                placeholder="Any additional feedback (optional)"
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedbackAndUnsubscribe}
                  disabled={submittingFeedback}
                  className="flex-1 bg-red-600 text-white rounded-xl py-2.5 hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? <Loader2 className="animate-spin" size={18} /> : <X size={18} />}
                  Unsubscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
