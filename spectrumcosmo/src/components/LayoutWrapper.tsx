'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AnimatePresence } from 'framer-motion';
import AuthLayout from './components/AuthLayout';
import AuthLanding from './components/AuthLanding';
import EmailStep from './components/EmailStep';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AuthMessages from './components/AuthMessages';

type AuthStep = 'landing' | 'email' | 'login' | 'register';

export default function AuthPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [step, setStep] = useState<AuthStep>('landing');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const verified = searchParams.get('verified');
  const registered = searchParams.get('registered');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    setMounted(true);
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setIsDark(currentTheme === 'dark');
  }, [theme, systemTheme]);

  useEffect(() => {
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
    if (['google_auth_failed', 'no_code', 'callback_failed'].includes(errorParam || '')) {
      setError('Something went wrong signing in with Google. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  }, [verified, registered, errorParam]);

  const handleEmailSubmit = async (emailValue: string) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/check-email?email=${encodeURIComponent(emailValue)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      
      setEmail(emailValue);
      
      if (data.exists) {
        setStep('login');
      } else {
        setStep('register');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => {
    setStep('landing');
  };

  const handleLoginSuccess = () => {
    setSuccess('Welcome back! Redirecting...');
    setTimeout(() => {
      router.push('/account');
      router.refresh();
    }, 1200);
  };

  const handleRegisterSuccess = (registeredEmail: string) => {
    setSuccess('Registration successful. Please check your email to verify.');
    setTimeout(() => {
      router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
    }, 1500);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleClearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderContent = () => {
    switch (step) {
      case 'landing':
        return (
          <AuthLanding
            onGoogleSuccess={handleLoginSuccess}
            onGoogleError={handleError}
            onEmailClick={() => setStep('email')}
            isDark={isDark}
          />
        );
      case 'email':
        return (
          <EmailStep
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleEmailSubmit}
            onBack={handleBackToLanding}
            loading={loading}
            isDark={isDark}
          />
        );
      case 'login':
        return (
          <LoginForm
            email={email}
            onSuccess={handleLoginSuccess}
            onError={handleError}
            onBack={handleBackToLanding}
            isDark={isDark}
          />
        );
      case 'register':
        return (
          <RegisterForm
            email={email}
            onSuccess={handleRegisterSuccess}
            onError={handleError}
            onBack={handleBackToLanding}
            isDark={isDark}
          />
        );
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <AuthLayout isDark={isDark}>
      <div className="relative z-10 w-full max-w-sm">
        <AuthMessages error={error} success={success} onClear={handleClearMessages} isDark={isDark} />
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
