'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';   // <-- changed
import { Eye, EyeOff, Loader2, Check, Shield } from 'lucide-react';

const mobileSlides = [ /* keep your existing array */ ];
const desktopSlides = [ /* keep your existing array */ ];

export default function LoginPage() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [index, setIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isTestAccount, setIsTestAccount] = useState(false);

  // (keep your existing useEffect for slideshow and window resize – unchanged)
  useEffect(() => { /* as before */ }, []);
  useEffect(() => { /* interval */ }, []);
  useEffect(() => { /* success timeout */ }, [success]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setIsTestAccount(false);

    // Use Better Auth signIn
    const { error: signInError } = await signIn.email({
      email,
      password,
      callbackURL: '/account',
    });

    if (signInError) {
      // Check for "email not verified" error
      if (signInError.message?.toLowerCase().includes('verify')) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(signInError.message || 'Invalid credentials');
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/account'), 1200);
    setLoading(false);
  };

  const logoSrc = "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png";

  return (
    <>
      {isTestAccount && ( /* your banner */ )}
      <div className="min-h-screen relative overflow-hidden bg-black">
        {/* slideshow background – keep your existing code */}
        <div className="relative min-h-screen flex items-center justify-center px-6 z-10">
          <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-6">
              <img src={logoSrc} alt="SpectrumCosmo" className="h-12 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold">Welcome Back</h2>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <Link href="/forgot-password" className="text-gray-300 hover:text-white transition">
                  Forgot password?
                </Link>
                <Link href="/signup" className="text-orange-400 hover:text-orange-300 transition">
                  Create account
                </Link>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
        {success && ( /* success toast */ )}
      </div>
    </>
  );
}
