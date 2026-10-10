'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock } from 'lucide-react';
import CaptchaModal from '@/components/ui/CaptchaModal';

// In the installed app there is no server inside the app, so a relative
// "/api/..." URL points at the app itself. AuthPage already uses this base for
// check-email; the login form must use the same one.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface LoginFormProps {
  email: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack: () => void;
  isDark: boolean;
}

export default function LoginForm({
  email,
  onSuccess,
  onError,
  onBack,
  isDark,
}: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState({ email: '', password: '' });
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.status === 428 && data.requiresCaptcha) {
        setShowCaptcha(true);
        setPendingCredentials({ email: email.trim(), password });
        setLoading(false);
        return;
      }

      if (res.status === 403 && data.needsVerification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email || email);
        onError(data.error || 'Please verify your email before logging in.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        onError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      onError('Something went wrong. Try again.');
    } finally {
      if (!needsVerification) setLoading(false);
    }
  };

  const handleCaptchaVerify = async (captchaToken: string, captchaAnswer: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
        onError(data.error || 'Verification failed');
        setShowCaptcha(false);
        throw new Error('CAPTCHA verification failed');
      }

      setShowCaptcha(false);
      onSuccess();
    } catch {
      onError('CAPTCHA verification failed. Please try again.');
      throw new Error('CAPTCHA verification failed');
    }
  };

  const handleCloseCaptcha = () => {
    setShowCaptcha(false);
    setLoading(false);
  };

  const handleResendVerification = async () => {
    const emailToSend = (unverifiedEmail || email).trim();
    if (!emailToSend) {
      onError('Please enter your email address first');
      return;
    }

    setResending(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend }),
      });

      const data = await res.json();

      if (res.ok) {
        onError('');
        setNeedsVerification(false);
        setTimeout(() => {
          onError('');
        }, 100);
      } else {
        onError(data.error || 'Failed to send verification email');
      }
    } catch {
      onError('Something went wrong. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-orange-500" />
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sign In
          </h2>
          <div className={`flex flex-wrap items-center justify-center gap-x-2 mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>Signing in as</span>
            <span className="font-medium text-orange-500 break-all">{email}</span>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center min-h-[44px] px-2 text-orange-500 hover:text-orange-600 text-xs underline"
            >
              Change
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lets password managers (and Android autofill) tie the password
              to this account. Not shown, not focusable. */}
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <div>
            <label htmlFor="login-password" className={`block text-sm font-medium mb-1.5 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            {/* No scale-up on focus: on a 320-360px screen it pushed the field
                past the edge of the card. The orange ring is the focus cue. */}
            <div className="relative">
              <Lock size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                id="login-password"
                name="password"
                autoComplete="current-password"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-14 py-3 min-h-[48px] text-base rounded-xl border transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-gray-800 text-white placeholder-gray-500'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                } ${
                  focusedField === 'password'
                    ? 'border-orange-500 ring-2 ring-orange-500/20'
                    : isDark
                    ? 'border-gray-700'
                    : 'border-gray-200'
                }`}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className={`absolute right-0 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                } transition`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onBack}
              className={`min-h-[44px] pr-3 text-sm ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              } transition-colors flex items-center gap-1`}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <Link
              href="/auth/forgot-password"
              className={`inline-flex items-center min-h-[44px] pl-3 text-sm ${
                isDark ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-500'
              } transition-colors`}
            >
              Forgot password?
            </Link>
          </div>

          {needsVerification && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="min-h-[44px] px-3 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 text-sm transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full min-h-[48px] bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 text-sm
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </motion.button>
        </form>
      </motion.div>

      <CaptchaModal
        isOpen={showCaptcha}
        onVerify={handleCaptchaVerify}
        onClose={handleCloseCaptcha}
      />
    </>
  );
}
