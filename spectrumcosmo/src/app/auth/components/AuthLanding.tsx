'use client';

import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

interface AuthLandingProps {
  onGoogleSuccess: () => void;
  onGoogleError: (error: string) => void;
  onEmailClick: () => void;
  isDark: boolean;
}

export default function AuthLanding({
  onGoogleSuccess,
  onGoogleError,
  onEmailClick,
  isDark,
}: AuthLandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-orange-500" />
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome Back
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Sign in to your SpectrumCosmo account
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <GoogleSignInButton 
              isDark={isDark}
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
            />
          </div>
        </div>

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

        <div className="flex justify-center">
          <motion.button
            onClick={onEmailClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-sm flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-200 
              dark:border-gray-700 dark:hover:border-orange-500 dark:text-gray-300 dark:hover:text-orange-400
              border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-500"
          >
            <Mail size={18} className="flex-shrink-0" />
            <span>Continue with Email</span>
          </motion.button>
        </div>

        <div className="mt-4 text-center">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </motion.div>
  );
}
