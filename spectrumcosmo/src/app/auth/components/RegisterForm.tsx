import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import CaptchaModal from '@/components/ui/CaptchaModal';

interface RegisterFormProps {
  email: string;
  onSuccess: (email: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
  isDark: boolean;
}

export default function RegisterForm({
  email,
  onSuccess,
  onError,
  onBack,
  isDark,
}: RegisterFormProps) {
  const [form, setForm] = useState({
    name: '',
    password: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingForm, setPendingForm] = useState({ name: '', password: '', confirm: '' });
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'confirm' | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      onError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      onError('Password must be at least 8 characters');
      return;
    }
    if (!acceptedTerms) {
      onError('Please accept the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email,
          password: form.password,
          acceptedTerms,
        }),
      });

      const data = await res.json();

      if (res.status === 428 && data.requiresCaptcha) {
        setPendingForm(form);
        setShowCaptcha(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // Handle race condition where email was taken after check
        if (res.status === 409) {
          onError('An account with this email already exists. Please sign in instead.');
        } else {
          onError(data.error || 'Registration failed');
        }
        setLoading(false);
        return;
      }

      onSuccess(email);
    } catch {
      onError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaVerify = async (captchaToken: string, captchaAnswer: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pendingForm.name,
          email,
          password: pendingForm.password,
          acceptedTerms,
          captchaToken,
          captchaAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          onError('An account with this email already exists. Please sign in instead.');
        } else {
          onError(data.error || 'Verification failed');
        }
        setShowCaptcha(false);
        throw new Error('CAPTCHA verification failed');
      }

      setShowCaptcha(false);
      onSuccess(email);
    } catch {
      onError('CAPTCHA verification failed. Please try again.');
      throw new Error('CAPTCHA verification failed');
    }
  };

  const handleCloseCaptcha = () => {
    setShowCaptcha(false);
    setLoading(false);
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
            <User size={22} className="text-orange-500" />
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create Account
          </h2>
          <div className={`flex items-center justify-center gap-2 mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>Creating account for</span>
            <span className="font-medium text-orange-500">{email}</span>
            <button
              onClick={onBack}
              className="text-orange-500 hover:text-orange-600 text-xs underline"
            >
              Change
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Full Name
            </label>
            <div className={`relative transition-all duration-200 ${
              focusedField === 'name' ? 'scale-[1.02]' : ''
            }`}>
              <User size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none ${
                  focusedField === 'name'
                    ? 'border-orange-500 ring-2 ring-orange-500/20'
                    : isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                required
              />
            </div>
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
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
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

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
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
                className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all focus:outline-none ${
                  focusedField === 'confirm'
                    ? 'border-orange-500 ring-2 ring-orange-500/20'
                    : isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                } transition`}
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
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
            />
            <label htmlFor="terms" className={`text-sm leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              I agree to the{' '}
              <Link href="/terms" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors">
                Terms & Conditions
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className={`flex-1 py-3 rounded-xl border-2 transition-all duration-200 ${
                isDark
                  ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <ArrowLeft size={18} className="inline mr-1" />
              Back
            </button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 text-sm"
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
          </div>
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
