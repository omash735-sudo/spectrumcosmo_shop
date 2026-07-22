// src/app/signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, EyeOff, Loader2, ArrowLeft, Check, Mail, Lock, User,
  ChevronRight, Shield
} from 'lucide-react';
import { useTheme } from 'next-themes';
import CaptchaModal from '@/components/ui/CaptchaModal';
import { motion, AnimatePresence } from 'framer-motion';

// Desktop carousel images
const desktopSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969177/WhatsApp_Image_2026-04-23_at_20.31.09_unga3v.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969160/WhatsApp_Image_2026-04-23_at_20.31.08_bv77wh.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969140/kkkk_a1elqx.jpg'
];

// Mobile carousel images (kept for mobile layout)
const mobileSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964570/WhatsApp_Image_2026-04-23_at_18.37.58_ihjqbi.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964617/WhatsApp_Image_2026-04-23_at_18.37.56_ztrygu.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964638/WhatsApp_Image_2026-04-23_at_18.37.55_llcwfg.jpg'
];

const MANGA_BG = 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1783775798/9b8e69a00494ab278c6f3f1e8d1a4f0c_vkjyhx.jpg';

const LOGOS = {
  light: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png',
  dark: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
};

export default function SignupPage() {
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingForm, setPendingForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'confirm' | null>(null);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          password: form.password,
          acceptedTerms
        })
      });
      
      const data = await res.json();
      
      if (res.status === 428 && data.requiresCaptcha) {
        setPendingForm(form);
        setShowCaptcha(true);
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      
      setSuccess('Registration successful. Please check your email to verify.');
      const registeredEmail = form.email;
      setForm({ name: '', email: '', password: '', confirm: '' });
      setAcceptedTerms(false);
      
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
      }, 1500);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleCaptchaVerify = async (captchaToken: string, captchaAnswer: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pendingForm.name,
          email: pendingForm.email,
          password: pendingForm.password,
          acceptedTerms,
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
      setSuccess('Registration successful. Please check your email to verify.');
      const registeredEmail = pendingForm.email;
      setForm({ name: '', email: '', password: '', confirm: '' });
      setAcceptedTerms(false);
      
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
      }, 1500);
    } catch {
      setError('CAPTCHA verification failed. Please try again.');
      throw new Error('CAPTCHA verification failed');
    }
  };

  const handleCloseCaptcha = () => {
    setShowCaptcha(false);
    setLoading(false);
  };

  const logoSrc = isDark ? LOGOS.dark : LOGOS.light;

  // ============================================================
  // DESKTOP LAYOUT (≥1024px) – 60/40 split (flex-[3] / flex-[2])
  // ============================================================
  if (isDesktop) {
    return (
      <>
        <div className="flex h-screen overflow-hidden bg-black">
          {/* LEFT SIDE – 60% (flex-[3]) */}
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
            
            {/* Solid overlay – no gradients */}
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative h-full flex flex-col justify-center px-10 z-10">
              <div className="flex items-center gap-3 mb-6">
                <img src={logoSrc} alt="SpectrumCosmo" className="h-12" />
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-white">SPECTRUM</span>
                  <span className="text-[var(--primary)]">COSMO</span>
                </span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white max-w-md"
              >
                <h1 className="text-4xl font-bold mb-3 leading-tight">
                  Join the
                  <br />
                  <span className="text-[var(--primary)]">anime community</span>
                </h1>
                <p className="text-gray-300 text-base mb-6 leading-relaxed">
                  Create your account and start exploring exclusive anime merch, deals, and more.
                </p>
              </motion.div>

              {/* Slide Indicators */}
              <div className="absolute bottom-8 left-10 flex gap-1.5">
                {desktopSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === index
                        ? 'w-6 bg-[var(--primary)]'
                        : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – 40% (flex-[2]) with curved clip-path */}
          <div className="relative flex-[2] overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${MANGA_BG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-[var(--background)]/70' 
                : 'bg-[var(--background)]/80'
            }`} />

            <div 
              className="relative h-full flex items-center justify-center p-6"
              style={{
                clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 8% 100%, 0% 50%)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative z-10 w-full max-w-sm"
              >
                <div className={`rounded-2xl p-6 shadow-2xl ${
                  isDark 
                    ? 'bg-[var(--background-card)]/95 backdrop-blur-sm border border-[var(--border)]' 
                    : 'bg-[var(--background-card)]/95 backdrop-blur-sm border border-[var(--border)]'
                }`}>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                      <User size={22} className="text-[var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                      Create Account
                    </h2>
                    <p className="text-sm mt-1 text-[var(--foreground-muted)]">
                      Join the SpectrumCosmo community
                    </p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`text-sm rounded-xl px-4 py-3 mb-4 ${
                          isDark
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

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                        Full Name
                      </label>
                      <div className={`relative transition-all duration-200 ${
                        focusedField === 'name' ? 'scale-[1.02]' : ''
                      }`}>
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                            focusedField === 'name'
                              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                              : 'border-[var(--border)]'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                        Email Address
                      </label>
                      <div className={`relative transition-all duration-200 ${
                        focusedField === 'email' ? 'scale-[1.02]' : ''
                      }`}>
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                            focusedField === 'email'
                              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                              : 'border-[var(--border)]'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                        Password
                      </label>
                      <div className={`relative transition-all duration-200 ${
                        focusedField === 'password' ? 'scale-[1.02]' : ''
                      }`}>
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all focus:outline-none bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                            focusedField === 'password'
                              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                              : 'border-[var(--border)]'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                        Confirm Password
                      </label>
                      <div className={`relative transition-all duration-200 ${
                        focusedField === 'confirm' ? 'scale-[1.02]' : ''
                      }`}>
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repeat your password"
                          value={form.confirm}
                          onChange={e => setForm({ ...form, confirm: e.target.value })}
                          onFocus={() => setFocusedField('confirm')}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all focus:outline-none bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                            focusedField === 'confirm'
                              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                              : 'border-[var(--border)]'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-[var(--border)] bg-[var(--background-secondary)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
                      />
                      <label htmlFor="terms" className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                        I agree to the{' '}
                        <Link href="/terms" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                          Terms & Conditions
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20 text-sm"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} />
                          Creating account...
                        </span>
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Already have an account?{' '}
                      <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors">
                        Sign in
                      </Link>
                    </p>
                  </div>

                  <div className="mt-4 text-center">
                    <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1">
                      <ArrowLeft size={14} />
                      Back to Shop
                    </Link>
                  </div>
                </div>
              </motion.div>
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

  // ============================================================
  // MOBILE LAYOUT (<1024px) – unchanged (already consistent)
  // ============================================================
  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--background)]">
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
              <span className="text-[var(--foreground)]">SPECTRUM</span>
              <span className="text-[var(--primary)]">COSMO</span>
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Create your account
            </p>
          </div>

          <div className="rounded-2xl p-6 shadow-xl border border-[var(--border)] bg-[var(--background-card)]">
            <h2 className="text-lg font-semibold mb-1 text-[var(--foreground)]">
              Create Account
            </h2>
            <p className="text-sm mb-6 text-[var(--foreground-muted)]">
              Enter your details to get started
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm rounded-xl px-4 py-3 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm rounded-xl px-4 py-3 mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-[var(--foreground-muted)]">
                  Name
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'name' ? 'scale-[1.02]' : ''
                }`}>
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                      focusedField === 'name'
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                        : 'border-[var(--border)]'
                    } focus:outline-none`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-[var(--foreground-muted)]">
                  Email
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'email' ? 'scale-[1.02]' : ''
                }`}>
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                      focusedField === 'email'
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                        : 'border-[var(--border)]'
                    } focus:outline-none`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-[var(--foreground-muted)]">
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'password' ? 'scale-[1.02]' : ''
                }`}>
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                      focusedField === 'password'
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                        : 'border-[var(--border)]'
                    } focus:outline-none`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-[var(--foreground-muted)]">
                  Confirm Password
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'confirm' ? 'scale-[1.02]' : ''
                }`}>
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] ${
                      focusedField === 'confirm'
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                        : 'border-[var(--border)]'
                    } focus:outline-none`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="terms" className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1">
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
