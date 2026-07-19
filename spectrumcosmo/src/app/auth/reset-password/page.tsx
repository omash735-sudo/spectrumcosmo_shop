'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No reset token provided');
        setValidating(false);
        return;
      }

      try {
        // Check if token exists and is valid
        const sql = (await import('@/lib/db')).getDb();
        const [result] = await sql`
          SELECT * FROM password_reset_tokens 
          WHERE token = ${token} AND expires_at > NOW()
        `;
        
        if (result) {
          setTokenValid(true);
        } else {
          setError('Invalid or expired reset link. Please request a new one.');
        }
      } catch {
        setError('Failed to validate token');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-[var(--foreground)]">SPECTRUM</span>
            <span className="text-[var(--primary)]">COSMO</span>
          </h1>
          <p className="text-[var(--foreground-muted)] mt-2">
            Create new password
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-xl border border-[var(--border)] bg-[var(--background-card)]">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Password Updated!</h3>
                <p className="text-[var(--foreground-muted)] text-sm">
                  Your password has been reset successfully.
                </p>
                <p className="text-[var(--foreground-muted)] text-xs mt-2">
                  Redirecting to login...
                </p>
              </motion.div>
            ) : tokenValid ? (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-[var(--foreground-muted)]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-[var(--foreground-muted)]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                      placeholder="Confirm new password"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Invalid Reset Link</h3>
                <p className="text-[var(--foreground-muted)] text-sm mb-6">
                  {error || 'This password reset link is invalid or has expired.'}
                </p>
                <Link 
                  href="/auth/forgot-password" 
                  className="inline-block bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20"
                >
                  Request New Link
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && tokenValid && (
            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <Link 
                href="/login" 
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
