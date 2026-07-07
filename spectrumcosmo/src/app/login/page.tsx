// app/auth/login/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, EyeOff, Loader2, Check, Shield, ArrowLeft, Mail, Lock, 
  Sparkles, ChevronRight, Store, Star, Users, TrendingUp
} from 'lucide-react';
import { useTheme } from 'next-themes';
import CaptchaModal from '@/components/ui/CaptchaModal';
import { motion, AnimatePresence } from 'framer-motion';

const mobileSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964570/WhatsApp_Image_2026-04-23_at_18.37.58_ihjqbi.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964617/WhatsApp_Image_2026-04-23_at_18.37.56_ztrygu.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964638/WhatsApp_Image_2026-04-23_at_18.37.55_llcwfg.jpg'
];

const desktopSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969177/WhatsApp_Image_2026-04-23_at_20.31.09_unga3v.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969160/WhatsApp_Image_2026-04-23_at_20.31.08_bv77wh.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969140/kkkk_a1elqx.jpg'
];

const trustBadges = [
  { icon: Shield, label: 'Secure Checkout' },
  { icon: Users, label: '10K+ Happy Customers' },
  { icon: Star, label: '4.9/5 Rating' },
  { icon: TrendingUp, label: 'Trusted Seller' },
];

const LOGOS = {
  light: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png',
  dark: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTestAccount, setIsTestAccount] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState({ email: '', password: '' });
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [emailError, setEmailError] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const activeSlides = isDesktop ? desktopSlides : mobileSlides;
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  useEffect(() => {
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');
    const registered = searchParams.get('registered');
    
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
      setTimeout(() => setSuccess(''), 5000);
    }
    if (registered === 'true') {
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => setSuccess(''), 5000);
    }
    if (errorParam === 'invalid_token') {
      setError('Invalid or expired verification link.');
      setTimeout(() => setError(''), 5000);
    }
    if (errorParam === 'expired_token') {
      setError('Verification link expired. Request a new one below.');
      setTimeout(() => setError(''), 5000);
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return '';
    if (!regex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, email: value });
    setEmailError(validateEmail(value));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = validateEmail(form.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      emailInputRef.current?.focus();
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    setIsTestAccount(false);
    setNeedsVerification(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          password: form.password 
        }),
      });

      const data = await res.json();

      if (res.status === 428 && data.requiresCaptcha) {
        setRequiresCaptcha(true);
        setShowCaptcha(true);
        setPendingCredentials({ email: form.email, password: form.password });
        setLoading(false);
        return;
      }

      if (res.status === 403 && data.needsVerification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email || form.email);
        setError(data.error || 'Please verify your email before logging in.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (data.user?.is_test_account) {
        setIsTestAccount(true);
      }

      setSuccess('Welcome back! Redirecting...');
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 1200);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
      }, 1200);
    } catch (err) {
      setError('CAPTCHA verification failed. Please try again.');
      throw err;
    }
  };

  const handleCloseCaptcha = () => {
    setShowCaptcha(false);
    setLoading(false);
  };

  const isDark = mounted && theme === 'dark';
  const logoSrc = isDark ? LOGOS.dark : LOGOS.light;

  // Desktop layout - Full screen, no scroll
  if (isDesktop) {
    return (
      <>
        {isTestAccount && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm text-yellow-800 dark:text-yellow-400">
            <Shield size={14} className="inline mr-1" />
            You are in read-only demo mode.
          </div>
        )}

        <div className="h-screen relative overflow-hidden bg-black">
          {activeSlides.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-center bg-cover" 
                style={{ backgroundImage: `url(${img})` }} 
              />
            </div>
          ))}
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          <div className="relative h-full flex items-center px-12 z-10">
            {/* Left Side - Brand Message */}
            <div className="flex-1 max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img src={logoSrc} alt="SpectrumCosmo" className="h-12" />
                  <span className="text-2xl font-bold tracking-tight">
                    <span className="text-white">SPECTRUM</span>
                    <span className="text-orange-400">COSMO</span>
                  </span>
                </div>
                
                <h1 className="text-4xl font-bold mb-3 leading-tight">
                  Welcome back to the
                  <br />
                  <span className="text-orange-400">anime marketplace</span>
                </h1>
                
                <p className="text-gray-300 text-base mb-6 max-w-md leading-relaxed">
                  Sign in to access exclusive anime merch, track orders, and connect with fellow fans.
                </p>

                <div className="flex gap-4">
                  {trustBadges.map((badge, i) => {
                    const Icon = badge.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Icon size={13} className="text-orange-400" />
                        </div>
                        <span className="text-xs text-gray-300">{badge.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Right Side - Login Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-sm ml-auto"
            >
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                    <Lock size={20} className="text-orange-400" />
                  </div>
                  <h2 className="text-white text-xl font-bold">Sign In</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Access your SpectrumCosmo account</p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`text-xs rounded-xl px-3 py-2 mb-3 ${
                        needsVerification
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                          : 'bg-red-500/20 border border-red-500/30 text-red-400'
                      }`}
                    >
                      {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-xl px-3 py-2 mb-3"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={onSubmit} className="space-y-3">
                  <div>
                    <label className="text-gray-300 text-xs font-medium mb-1 block">Email Address</label>
                    <div className={`relative transition-all duration-200 ${
                      focusedField === 'email' ? 'scale-[1.02]' : ''
                    }`}>
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        ref={emailInputRef}
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleEmailChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white/5 text-white placeholder-gray-500 border transition-all ${
                          emailError
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : focusedField === 'email'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-white/10'
                        } focus:outline-none`}
                        required
                      />
                    </div>
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-[10px] mt-0.5"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 text-xs font-medium mb-1 block">Password</label>
                    <div className={`relative transition-all duration-200 ${
                      focusedField === 'password' ? 'scale-[1.02]' : ''
                    }`}>
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-white/5 text-white placeholder-gray-500 border transition-all ${
                          focusedField === 'password'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-white/10'
                        } focus:outline-none`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/auth/forgot-password" className="text-xs text-gray-400 hover:text-orange-400 transition-all hover:translate-x-0.5 inline-flex items-center gap-0.5">
                      Forgot password?
                      <ChevronRight size={12} />
                    </Link>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </form>

                {needsVerification && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-orange-400 hover:text-orange-300 text-xs transition-colors disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <p className="text-gray-400 text-xs">
                    Don't have an account?{' '}
                    <Link href="/auth/register" className="text-orange-400 hover:text-orange-300 font-medium transition-all hover:translate-x-0.5 inline-flex items-center gap-0.5 text-xs">
                      Create one
                      <ChevronRight size={12} />
                    </Link>
                  </p>
                </div>

                <div className="mt-2 text-center">
                  <Link href="/" className="text-gray-500 text-[11px] hover:text-gray-400 transition-colors inline-flex items-center gap-0.5">
                    <ArrowLeft size={12} />
                    Back to Shop
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-6 bg-orange-500'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
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

  // Mobile layout
  return (
    <>
      {isTestAccount && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm text-yellow-800 dark:text-yellow-400">
          <Shield size={14} className="inline mr-1" />
          You are in read-only demo mode.
        </div>
      )}

      <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${
        isDark ? 'bg-black' : 'bg-white'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <img src={logoSrc} alt="SpectrumCosmo" className="h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className={isDark ? 'text-white' : 'text-gray-900'}>SPECTRUM</span>
              <span className="text-orange-500">COSMO</span>
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to your account
            </p>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl ${
            isDark 
              ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-800' 
              : 'bg-white border border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to manage your account and orders
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-sm rounded-xl px-4 py-3 mb-4 ${
                    needsVerification
                      ? isDark 
                        ? 'bg-yellow-900/30 border border-yellow-800 text-yellow-400'
                        : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                      : isDark
                        ? 'bg-red-900/30 border border-red-800 text-red-400'
                        : 'bg-red-50 border border-red-200 text-red-600'
                  }`}
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-sm rounded-xl px-4 py-3 mb-4 ${
                    isDark
                      ? 'bg-green-900/30 border border-green-800 text-green-400'
                      : 'bg-green-50 border border-green-200 text-green-700'
                  }`}
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'email' ? 'scale-[1.02]' : ''
                }`}>
                  <Mail size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    ref={emailInputRef}
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                      emailError
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : focusedField === 'email'
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } placeholder-gray-500 focus:outline-none`}
                    required
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              <div>
                <label className={`text-sm font-medium mb-1.5 block ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'password' ? 'scale-[1.02]' : ''
                }`}>
                  <Lock size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all ${
                      focusedField === 'password'
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } placeholder-gray-500 focus:outline-none`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className={`text-sm ${
                  isDark ? 'text-gray-400 hover:text-orange-400' : 'text-gray-500 hover:text-orange-500'
                } transition-colors`}>
                  Forgot password?
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Signing in...
                  </span>
                ) : (
                  'Continue'
                )}
              </motion.button>
            </form>

            {needsVerification && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-orange-500 hover:text-orange-600 text-sm transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            )}

            <div className={`mt-6 pt-6 border-t text-center ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className={`text-sm ${
                isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
              } transition-colors inline-flex items-center gap-1`}>
                <ArrowLeft size={14} />
                Back to Shop
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <CaptchaModal
        isOpen={showCaptcha}
        onVerify={handleCaptchaVerify}
        onClose={handleCloseCaptcha}
      />
    </>
  );
}
