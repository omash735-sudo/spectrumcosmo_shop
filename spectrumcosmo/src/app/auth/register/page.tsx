// app/auth/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, Check, Mail, Lock, User } from 'lucide-react';
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

// Theme-aware logo URLs
const LOGOS = {
  light: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png',
  dark: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
};

export default function RegisterPage() {
  const router = useRouter();
  const { theme } = useTheme();
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
      
      setSuccess('Registration successful! Please check your email to verify.');
      setForm({ name: '', email: '', password: '', confirm: '' });
      setAcceptedTerms(false);
      
      setTimeout(() => {
        router.push('/auth/login?registered=true');
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
      setSuccess('Registration successful! Please check your email to verify.');
      setForm({ name: '', email: '', password: '', confirm: '' });
      setAcceptedTerms(false);
      
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 1500);
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

  // Desktop layout
  if (isDesktop) {
    return (
      <>
        <div className="min-h-screen relative overflow-hidden bg-black">
          {activeSlides.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-center bg-cover scale-105" 
                style={{ backgroundImage: `url(${img})` }} 
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="relative min-h-screen flex items-center px-12 z-10">
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
                
                <h1 className="text-5xl font-bold mb-4 leading-tight">
                  Join the
                  <br />
                  <span className="text-orange-400">anime community</span>
                </h1>
                
                <p className="text-gray-300 text-lg mb-8 max-w-md leading-relaxed">
                  Create your account and start exploring exclusive anime merch, deals, and more.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-md ml-auto"
            >
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <User size={24} className="text-orange-400" />
                  </div>
                  <h2 className="text-white text-2xl font-bold">Create Account</h2>
                  <p className="text-gray-400 text-sm mt-1">Join the SpectrumCosmo community</p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4"
                    >
                      {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3 mb-4"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Full Name</label>
                    <div className={`relative transition-all duration-200 ${
                      focusedField === 'name' ? 'scale-[1.02]' : ''
                    }`}>
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 border transition-all ${
                          focusedField === 'name'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-white/10'
                        } focus:outline-none`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Email</label>
                    <div className={`relative transition-all duration-200 ${
                      focusedField === 'email' ? 'scale-[1.02]' : ''
                    }`}>
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 border transition-all ${
                          focusedField === 'email'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-white/10'
                        } focus:outline-none`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Password</label>
                    <div className={`relative transition-all duration-200 ${
                      focusedField === 'password' ? 'scale-[1.02]' : ''
                    }`}>
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 border transition-all ${
                          focusedField === 'password'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-white/10'
                        } focus:outline-none`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Confirm Password</label>
                    <div className={`relative transition-all duration-200 ${
                      focusedField === 'confirm' ? 'scale-[1.02]' : ''
                    }`}>
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={form.confirm}
                        onChange={e => setForm({ ...form, confirm: e.target.value })}
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 border transition-all ${
                          focusedField === 'confirm'
                            ? 'border-orange-500 ring-2 ring-orange-500/20'
                            : 'border-white/10'
                        } focus:outline-none`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
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
                      className="mt-1 w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-white/10"
                    />
                    <label htmlFor="terms" className="text-gray-400 text-sm leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-orange-400 hover:text-orange-300 transition-colors">
                        Terms & Conditions
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-orange-400 hover:text-orange-300 transition-colors">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
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

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium transition-all hover:translate-x-0.5 inline-flex items-center gap-1">
                      Sign in
                      <ChevronRight size={14} />
                    </Link>
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/" className="text-gray-500 text-sm hover:text-gray-400 transition-colors inline-flex items-center gap-1">
                    <ArrowLeft size={14} />
                    Back to Shop
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-8 bg-orange-500'
                    : 'bg-white/30 hover:bg-white/50'
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
      <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${
        isDark ? 'bg-black' : 'bg-white'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo - Theme Aware */}
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
              Create your account
            </p>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl ${
            isDark 
              ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-800' 
              : 'bg-white border border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create Account
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                <label className={`text-sm font-medium mb-1.5 block ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Name
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'name' ? 'scale-[1.02]' : ''
                }`}>
                  <User size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                      focusedField === 'name'
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } placeholder-gray-500 focus:outline-none`}
                    required
                  />
                </div>
              </div>

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
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                      focusedField === 'email'
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } placeholder-gray-500 focus:outline-none`}
                    required
                  />
                </div>
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
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

              <div>
                <label className={`text-sm font-medium mb-1.5 block ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm Password
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'confirm' ? 'scale-[1.02]' : ''
                }`}>
                  <Lock size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all ${
                      focusedField === 'confirm'
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } placeholder-gray-500 focus:outline-none`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
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
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="terms" className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  I agree to the{' '}
                  <Link href="/terms" className="text-orange-500 hover:text-orange-600 transition-colors">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-orange-500 hover:text-orange-600 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
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
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            <div className={`mt-6 pt-6 border-t text-center ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Already have an account?{' '}
                <Link href="/auth/login" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  Sign in
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
