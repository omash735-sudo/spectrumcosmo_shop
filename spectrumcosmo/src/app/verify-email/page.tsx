'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Send, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.replace('/signup');
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to resend verification email');
        return;
      }

      setStatus('success');
      setMessage('Verification email sent! Check your inbox.');
      setCooldown(30);
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl p-8 shadow-xl border border-[var(--border)] bg-[var(--background-card)] text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6"
          >
            <Mail size={36} className="text-[var(--primary)]" />
          </motion.div>

          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Check Your Email
          </h1>
          
          <p className="text-[var(--foreground-muted)] mb-6 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-semibold text-[var(--foreground)] break-all">{email}</span>
          </p>

          {/* Steps */}
          <div className="bg-[var(--background-secondary)] rounded-xl p-5 mb-6 text-left space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[var(--primary)]">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Open your inbox</p>
                <p className="text-xs text-[var(--foreground-muted)]">Check spam or promotions folder if you don't see it</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[var(--primary)]">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Click the verification link</p>
                <p className="text-xs text-[var(--foreground-muted)]">The link expires in 24 hours</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[var(--primary)]">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">You're all set!</p>
                <p className="text-xs text-[var(--foreground-muted)]">Log in and start shopping</p>
              </div>
            </div>
          </div>

          {/* Status messages */}
          <AnimatePresence>
            {status === 'error' && message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
              >
                <AlertCircle size={16} />
                {message}
              </motion.div>
            )}

            {status === 'success' && message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              >
                <CheckCircle2 size={16} />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={status === 'loading' || cooldown > 0}
            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center gap-2 mb-4"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw size={18} />
                Resend in {cooldown}s
              </>
            ) : (
              <>
                <Send size={18} />
                Resend Verification Email
              </>
            )}
          </button>

          {/* Links */}
          <div className="space-y-3 pt-4 border-t border-[var(--border)]">
            <Link
              href="/auth/login"
              className="block text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Already verified? Sign in
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Shop
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
