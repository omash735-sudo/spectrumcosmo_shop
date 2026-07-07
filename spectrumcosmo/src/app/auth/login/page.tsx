// app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Check, Shield, ArrowLeft } from 'lucide-react';
import CaptchaModal from '@/components/ui/CaptchaModal';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState({ email: '', password: '' });
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // Check for verification success/error from URL params
  useEffect(() => {
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');
    const registered = searchParams.get('registered');
    
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
    if (registered === 'true') {
      setSuccess('Registration successful! Please check your email to verify your account.');
    }
    if (errorParam === 'invalid_token') {
      setError('Invalid or expired verification link. Request a new one below.');
    }
    if (errorParam === 'expired_token') {
      setError('Verification link expired. Request a new one below.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setNeedsVerification(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      // CAPTCHA required after multiple failed attempts
      if (res.status === 428 && data.requiresCaptcha) {
        setRequiresCaptcha(true);
        setShowCaptcha(true);
        setPendingCredentials({ email: form.email, password: form.password });
        setLoading(false);
        return;
      }
      
      // Email not verified
      if (res.status === 403 && data.needsVerification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email || form.email);
        setError(data.error || 'Please verify your email before logging in.');
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      
      // Successful login
      setSuccess('Welcome back! Redirecting...');
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 800);
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  const handleResendVerification = async () => {
    const emailToSend = unverifiedEmail || form.email;
    if (!emailToSend) {
      setError('Please enter your email address first');
      return;
    }
    
    setResending(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Verification email sent! Please check your inbox.');
        setNeedsVerification(false);
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleCaptchaVerify = async (captchaToken: string, captchaAnswer: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingCredentials.email,
          password: pendingCredentials.password,
          captchaToken,
          captchaAnswer,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setShowCaptcha(false);
        throw new Error('CAPTCHA verification failed');
      }
      
      setShowCaptcha(false);
      setRequiresCaptcha(false);
      setSuccess('Welcome back! Redirecting...');
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 800);
    } catch (err) {
      setError('CAPTCHA verification failed. Please try again.');
      throw err;
    }
  };

  const handleCloseCaptcha = () => {
    setShowCaptcha(false);
    setLoading(false);
  };

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-4xl font-black tracking-wider">
                <span className="text-white">SPECTRUM</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500">COSMO</span>
              </h1>
            </Link>
            <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-white text-xl font-bold mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your credentials to access your account</p>

            {error && (
              <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${
                needsVerification
                  ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3 mb-4">
                {success}
              </div>
            )}

            {requiresCaptcha && !showCaptcha && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Multiple failed attempts detected. Additional verification required.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Resend verification button */}
            {needsVerification && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-gray-500 text-sm hover:text-gray-400 transition-colors inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              Back to Shop
            </Link>
          </div>
        </div>
      </div>

      <CaptchaModal
        isOpen={showCaptcha}
        onVerify={handleCaptchaVerify}
        onClose={handleCloseCaptcha}
      />
    </>
  );
}
