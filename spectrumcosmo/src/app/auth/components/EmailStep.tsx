'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

interface EmailStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (email: string) => void;
  onBack: () => void;
  loading: boolean;
  isDark: boolean;
}

export default function EmailStep({
  email,
  onEmailChange,
  onSubmit,
  onBack,
  loading,
  isDark,
}: EmailStepProps) {
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return '';
    if (!regex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onEmailChange(value);
    const validationError = validateEmail(value);
    setError(validationError);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(email);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={22} className="text-orange-500" />
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Enter your email
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          We'll check if you have an account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Email Address
          </label>
          <div className={`relative transition-all duration-200 ${
            error ? 'scale-[1.02]' : ''
          }`}>
            <Mail size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              ref={inputRef}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:outline-none ${
                error
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
              required
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 dark:text-red-400 text-xs mt-1"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border-2 transition-all duration-200 
              dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300
              border-gray-300 hover:border-gray-400 text-gray-700
              flex items-center justify-center gap-1"
          >
            <ArrowLeft size={18} className="flex-shrink-0" />
            <span>Back</span>
          </button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 text-sm
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Checking...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
