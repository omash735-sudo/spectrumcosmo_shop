// app/newsletter/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, CheckCircle, Loader2, X, ArrowRight, Send, 
  Users, Bell, Tag, Rocket
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import toast from 'react-hot-toast';

const MANGA_BG = 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1783775798/9b8e69a00494ab278c6f3f1e8d1a4f0c_vkjyhx.jpg';

export default function NewsletterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          setUser(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setEmailInput(data.user?.email || '');
        
        if (data.user?.email) {
          await checkSubscriptionStatus(data.user.email);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
    loadSubscriberCount();
  }, []);

  // Load subscriber count
  const loadSubscriberCount = async () => {
    try {
      const res = await fetch('/api/subscribe/count');
      if (res.ok) {
        const data = await res.json();
        setSubscriberCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to load subscriber count:', err);
    } finally {
      setCountLoading(false);
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async (email: string) => {
    if (!email) return;
    setCheckingSubscription(true);
    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribed(data.subscribed === true);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    } finally {
      setCheckingSubscription(false);
    }
  };

  // Subscribe
  const performSubscribe = async (email: string) => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          name: user?.name || '',
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Check your email to confirm subscription! 📧');
        await checkSubscriptionStatus(email);
        await loadSubscriberCount();
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Failed to subscribe', error);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // Unsubscribe
  const performUnsubscribe = async () => {
    if (!user?.email) {
      toast.error('No email found to unsubscribe');
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/subscribe/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          reason: feedbackReason || 'No reason provided',
          details: feedbackDetails || '',
        }),
      });
      
      if (res.ok) {
        setSubscribed(false);
        toast.success('You have been unsubscribed. We\'re sad to see you go! 💔');
        setShowFeedback(false);
        setFeedbackReason('');
        setFeedbackDetails('');
        await loadSubscriberCount();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Failed to unsubscribe', error);
      toast.error('Something went wrong');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Toggle subscription
  const toggleSubscription = async () => {
    if (subscribed) {
      setShowFeedback(true);
    } else {
      await performSubscribe(emailInput);
    }
  };

  // Submit feedback and unsubscribe
  const submitFeedbackAndUnsubscribe = async () => {
    await performUnsubscribe();
  };

  // Render loading state
  if (loading || checkingSubscription) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--foreground-muted)]">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)]">
        
        {/* ============================================
            HERO SECTION - manga-bg + hero-manga
            ============================================ */}
        <section 
          className="relative min-h-[60vh] md:min-h-[70vh] flex items-center overflow-x-hidden manga-bg hero-manga py-8 md:py-12"
          style={{
            backgroundImage: `url(${MANGA_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-white/80 dark:bg-black/70" />
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              
              {/* Badge - Join Our Community (bold, no sparkles) */}
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-4 py-2 rounded-full mb-6">
                <span className="text-sm font-bold text-[var(--primary)]">Join Our Community</span>
              </div>
              
              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--foreground)] mb-3">
                The SpectrumCosmo
              </h1>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--primary)] mb-4">
                Newsletter
              </p>
              <p className="text-base md:text-lg text-[var(--foreground-muted)] max-w-xl mx-auto mb-6">
                Get the latest anime merch drops, exclusive offers, and community updates delivered to your inbox.
              </p>
              
              {/* Live Subscriber Counter */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <Users size={18} className="text-[var(--foreground-muted)]" />
                <span className="text-sm text-[var(--foreground-muted)]">
                  {countLoading ? (
                    <Loader2 size={14} className="animate-spin inline" />
                  ) : (
                    `${subscriberCount.toLocaleString()} fans subscribed`
                  )}
                </span>
              </div>
              
              {/* Subscription Form */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-5 py-3 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition min-h-[48px]"
                />
                <button
                  onClick={toggleSubscription}
                  disabled={saving}
                  className={`min-w-[140px] px-6 py-3 rounded-full font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all min-h-[48px] ${
                    subscribed
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white'
                  }`}
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : subscribed ? (
                    <>
                      <X size={18} />
                      <span>Unsubscribe</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Subscribe</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Status Indicator */}
              {subscribed && (
                <div className="mt-4 flex items-center justify-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 py-1.5 px-4 rounded-full max-w-xs mx-auto">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">You're subscribed! ✓</span>
                </div>
              )}

              <p className="text-[var(--foreground-muted)] text-xs mt-4">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </section>

        {/* ============================================
            BOTTOM SUBSCRIPTION CARD - bg-[#111111]
            ============================================ */}
        <div className="bg-[#111111] py-16 lg:py-20 border-t border-[var(--border)]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mail size={28} className="text-[var(--primary)]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-4">
              Join Our Newsletter
            </h2>
            <p className="text-[#9A9A9A] mb-8 max-w-lg mx-auto">
              Get exclusive offers, early access to new drops, and anime news delivered to your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-5 py-3 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition min-h-[48px]"
              />
              <button
                onClick={toggleSubscription}
                disabled={saving}
                className={`min-w-[140px] px-6 py-3 rounded-full font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all min-h-[48px] ${
                  subscribed
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white'
                }`}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : subscribed ? (
                  <>
                    <X size={18} />
                    <span>Unsubscribe</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[var(--foreground-muted)] text-xs mt-4">No spam. Unsubscribe anytime.</p>
            
            {/* Preferences Link */}
            <div className="mt-6">
              <Link 
                href="/newsletter/preferences" 
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition inline-flex items-center gap-1"
              >
                Customize your preferences <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* ============================================
          UNSUBSCRIBE FEEDBACK MODAL
          ============================================ */}
      {showFeedback && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" 
          onClick={() => setShowFeedback(false)}
        >
          <div 
            className="bg-[var(--background-card)] rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)]" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">We're sad to see you go</h3>
                <button 
                  onClick={() => setShowFeedback(false)} 
                  className="p-1 hover:bg-[var(--background-secondary)] rounded-lg transition"
                >
                  <X size={20} className="text-[var(--foreground-muted)]" />
                </button>
              </div>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">Help us improve by sharing your reason</p>
            </div>
            
            <div className="p-6">
              <select
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                className="w-full p-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl mb-4 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition"
              >
                <option value="">Select a reason...</option>
                <option value="Too many emails">Too many emails</option>
                <option value="Content not relevant">Content not relevant</option>
                <option value="Didn't sign up for this">Didn't sign up for this</option>
                <option value="Other">Other</option>
              </select>
              
              <textarea
                value={feedbackDetails}
                onChange={(e) => setFeedbackDetails(e.target.value)}
                placeholder="Any additional feedback (optional)"
                rows={3}
                className="w-full p-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl mb-4 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition resize-none"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedbackAndUnsubscribe}
                  disabled={submittingFeedback}
                  className="flex-1 bg-red-600 text-white rounded-xl py-2.5 hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
