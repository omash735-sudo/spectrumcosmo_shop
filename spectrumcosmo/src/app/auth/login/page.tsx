'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CaptchaModal from '@/components/ui/CaptchaModal';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState({ email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      // Rule 9: CAPTCHA required after multiple failed attempts
      if (res.status === 428 && data.requiresCaptcha) {
        setRequiresCaptcha(true);
        setShowCaptcha(true);
        setPendingCredentials({ email: form.email, password: form.password });
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      
      // Successful login
      router.push('/account');
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

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
      
      // Successful login after CAPTCHA
      setShowCaptcha(false);
      setRequiresCaptcha(false);
      router.push('/account');
      router.refresh();
    } catch (err) {
      setError('CAPTCHA verification failed. Please try again.');
      throw err;
    }
  };

  const handleCloseCaptcha = () => {
    setShowCaptcha(false);
    setLoading(false);
  };

  return (
    <>
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        {/* Animated background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl font-black tracking-wider">
                <span className="text-white">SPECTRUM</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">COSMO</span>
              </h1>
            </Link>
            <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-white text-xl font-bold mb-6">Welcome Back</h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            {requiresCaptcha && !showCaptcha && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Multiple failed attempts detected. Additional verification required.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Back to shop */}
          <div className="text-center mt-6">
            <Link href="/" className="text-gray-500 text-sm hover:text-gray-400 transition-colors">
              ← Back to Shop
            </Link>
          </div>
        </div>
      </main>

      {/* CAPTCHA Modal */}
      <CaptchaModal
        isOpen={showCaptcha}
        onVerify={handleCaptchaVerify}
        onClose={handleCloseCaptcha}
      />
    </>
  );
}
