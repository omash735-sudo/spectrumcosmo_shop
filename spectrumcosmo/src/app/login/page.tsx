
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
import { useGoogleLogin } from '@react-oauth/google';

const desktopSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/b9b5c0ea33a39be2b0aa420ba5d665ce.webp_n59npa.webp',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/f09477c9aef7e70ff0a559489fac4dcd_mffof9.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/d06ebcc93b8c82b1af5eaeb992d8113f_jy0lt0.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/a8695ea4a7d8d41af342b506893c8f66_hqawc8.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/7d489dc0932a70d5c13a49eb6a04b3d5.webp_ic8mhb.webp',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/d98193c851d049a19cf7de400ec47132_fepxrd.jpg'
];

const MANGA_BG = 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1783775798/9b8e69a00494ab278c6f3f1e8d1a4f0c_vkjyhx.jpg';

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

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, systemTheme } = useTheme();
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const user = await userInfo.json();
        
        const res = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accessToken: tokenResponse.access_token,
            user: user 
          }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setSuccess('Welcome! Redirecting...');
          setTimeout(() => {
            window.location.href = '/account';
          }, 500);
        } else {
          setError(data.error || 'Google login failed');
          setGoogleLoading(false);
        }
      } catch (err) {
        console.error('Google login error:', err);
        setError('Google login failed. Please try again.');
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    },
  });

  useEffect(() => {
    setMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % desktopSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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

  const logoSrc = isDark ? LOGOS.dark : LOGOS.light;

  // ============================================================
  // DESKTOP LAYOUT (≥1024px)
  // ============================================================
  if (isDesktop) {
    return (
      <>
        {isTestAccount && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm text-yellow-800 dark:text-yellow-400">
            <Shield size={14} className="inline mr-1" />
            You are in read-only demo mode.
          </div>
        )}

        <div className="flex h-screen overflow-hidden bg-black">
          {/* LEFT SIDE – 60% */}
          <div className="relative flex-[3] bg-black overflow-hidden">
            {desktopSlides.map((img, i) => (
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
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative h-full flex flex-col justify-center px-10 z-10">
              <div className="flex items-center gap-3 mb-6">
                <img src={logoSrc} alt="SpectrumCosmo" className="h-12" />
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-white">SPECTRUM</span>
                  <span className="text-orange-400">COSMO</span>
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white max-w-md"
              >
                <h1 className="text-4xl font-bold mb-3 leading-tight">
                  Welcome back to the
                  <br />
                  <span className="text-orange-400">anime marketplace</span>
                </h1>
                <p className="text-gray-300 text-base mb-6 leading-relaxed">
                  Sign in to access exclusive anime merch, track orders, and connect with fellow fans.
                </p>
              </motion.div>

              <div className="flex flex-wrap gap-4">
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

              <div className="absolute bottom-8 left-10 flex gap-1.5">
                {desktopSlides.map((_, i) => (
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
          </div>

          {/* RIGHT SIDE – 40% */}
          <div 
            className="relative flex-[2] flex items-center justify-center p-6 overflow-hidden"
            style={{
              backgroundImage: `url(${MANGA_BG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-black/70' 
                : 'bg-white/80'
            }`} />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-10 w-full max-w-sm"
            >
              <div className={`rounded-2xl p-6 shadow-2xl ${
                isDark 
                  ? 'bg-gray-900/95 backdrop-blur-sm border border-gray-800' 
                  : 'bg-white/95 backdrop-blur-sm border border-gray-200'
              }`}>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                    <Lock size={22} className="text-orange-500" />
                  </div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Sign In
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Access your SpectrumCosmo account
                  </p>
                </div>

                {/* Google Sign-In Button (Desktop) */}
                <div className="mb-4">
                  <button
                    onClick={() => googleLogin()}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {googleLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="text-sm font-medium">
                      {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                    </span>
                  </button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className={`px-3 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} text-gray-500 dark:text-gray-400`}>
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`text-sm rounded-xl px-4 py-3 mb-4 ${
                        needsVerification
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
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
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3 mb-4"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none ${
                          emailError
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : focusedField === 'email'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : isDark
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                        required
                      />
                    </div>
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 dark:text-red-400 text-xs mt-1"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${
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
                        className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all focus:outline-none ${
                          focusedField === 'password'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : isDark
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        } transition`}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/auth/forgot-password"
                      className={`text-sm ${
                        isDark ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-500'
                      } transition-colors`}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </form>

                {needsVerification && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 text-sm transition-colors disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </div>
                )}

                <div className={`mt-6 pt-6 border-t text-center ${
                  isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Don't have an account?{' '}
                    <Link href="/auth/register" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors">
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
        </div>

        <CaptchaModal
          isOpen={showCaptcha}
          onVerify={handleCaptchaVerify}
          onClose={handleCloseCaptcha}
        />
      </>
    );
  }

  // ============================================================
  // MOBILE LAYOUT (<1024px)
  // ============================================================
  return (
    <>
      {isTestAccount && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm text-yellow-800 dark:text-yellow-400">
          <Shield size={14} className="inline mr-1" />
          You are in read-only demo mode.
        </div>
      )}

      <div 
        className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
        style={{
          backgroundImage: `url(${MANGA_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-black/70' 
            : 'bg-white/80'
        }`} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-sm"
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
              : 'bg-white/95 backdrop-blur-xl border border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to manage your account and orders
            </p>

            {/* Google Sign-In Button (Mobile) */}
            <div className="mb-4">
              <button
                onClick={() => googleLogin()}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm font-medium">
                  {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-3 ${isDark ? 'bg-gray-900/80' : 'bg-white/95'} text-gray-500 dark:text-gray-400`}>
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>

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
