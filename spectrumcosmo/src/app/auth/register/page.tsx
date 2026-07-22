// app/auth/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, EyeOff, Loader2, ArrowLeft, Check, Mail, Lock, User, ChevronRight
} from 'lucide-react';
import { useTheme } from 'next-themes';
import CaptchaModal from '@/components/ui/CaptchaModal';
import { motion, AnimatePresence } from 'framer-motion';

// Same carousel images as login
const desktopSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/b9b5c0ea33a39be2b0aa420ba5d665ce.webp_n59npa.webp',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/f09477c9aef7e70ff0a559489fac4dcd_mffof9.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/d06ebcc93b8c82b1af5eaeb992d8113f_jy0lt0.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/a8695ea4a7d8d41af342b506893c8f66_hqawc8.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/7d489dc0932a70d5c13a49eb6a04b3d5.webp_ic8mhb.webp',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/d98193c851d049a19cf7de400ec47132_fepxrd.jpg'
];

const MANGA_BG = 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1783775798/9b8e69a00494ab278c6f3f1e8d1a4f0c_vkjyhx.jpg';

const LOGOS = {
  light: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png',
  dark: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
};

export default function RegisterPage() {
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

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % desktopSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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
  // DESKTOP LAYOUT (≥1024px) – Split‑screen with curved right side
  // ============================================================
  if (isDesktop) {
    return (
      <>
        <div className="flex h-screen overflow-hidden bg-[var(--background)]">
          {/* LEFT SIDE – Image Carousel + Branding (50%) */}
          <div className="relative flex-1 bg-black overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <div className="relative h-full flex flex-col justify-center px-12 z-10">
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
              <div className="absolute bottom-8 left-12 flex gap-1.5">
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

          {/* RIGHT SIDE – Manga Background + Curved edges (50%) */}
          <div className="relative flex-1 overflow-hidden">
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
              className="relative h-full flex items-center justify-center p-8"
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
                <div className={`rounded-2xl p-8 shadow-xl ${
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
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4"
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
                      className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
  // MOBILE LAYOUT (<1024px) – Manga background behind form
  // ============================================================
  return (
    <>
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[var(--background)]"
        style={{
          backgroundImage: `url(${MANGA_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-[var(--background)]/70' 
            : 'bg-[var(--background)]/80'
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
              <span className="text-[var(--foreground)]">SPECTRUM</span>
              <span className="text-[var(--primary)]">COSMO</span>
            </h1>
            <p className="text-sm mt-1 text-[var(--foreground-muted)]">
              Create your account
            </p>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl ${
            isDark 
              ? 'bg-[var(--background-card)]/95 backdrop-blur-xl border border-[var(--border)]' 
              : 'bg-[var(--background-card)]/95 backdrop-blur-xl border border-[var(--border)]'
          }`}>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
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
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
