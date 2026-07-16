'use client';

import { useState } from 'react';
import { X, Shield, Loader2 } from 'lucide-react';

interface CaptchaModalProps {
  isOpen: boolean;
  onVerify: (token: string, answer: string) => Promise<void>;
  onClose: () => void;
}

export default function CaptchaModal({ isOpen, onVerify, onClose }: CaptchaModalProps) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaChallenge, setCaptchaChallenge] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const loadCaptcha = async () => {
    setLoadingCaptcha(true);
    setError('');
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaToken(data.token);
      setCaptchaChallenge(data.challenge);
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
      setError('Failed to load verification. Please try again.');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!captchaToken || !captchaAnswer) {
      setError('Please enter the answer');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await onVerify(captchaToken, captchaAnswer);
    } catch (err) {
      setError('Invalid CAPTCHA. Please try again.');
      loadCaptcha();
      setCaptchaAnswer('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-[var(--background-card)] rounded-2xl shadow-xl max-w-md w-full mx-auto border border-[var(--border)]">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Shield size={18} className="sm:w-5 sm:h-5 text-[var(--primary)]" />
            <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Security Verification</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[var(--background-secondary)] rounded-full transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} className="text-[var(--foreground-muted)]" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Multiple failed login attempts detected. Please complete the verification below.
          </p>
          
          {!captchaToken ? (
            <button
              onClick={loadCaptcha}
              disabled={loadingCaptcha}
              className="w-full py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium"
            >
              {loadingCaptcha ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                'Load CAPTCHA'
              )}
            </button>
          ) : (
            <>
              <div className="bg-[var(--background-secondary)] p-4 rounded-xl text-center mb-4 border border-[var(--border)]">
                <p className="text-lg font-mono text-[var(--foreground)] tracking-wide">{captchaChallenge}</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 opacity-70">Solve the challenge above</p>
              </div>
              
              <input
                type="text"
                placeholder="Enter your answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition min-h-[44px] mb-3 sm:mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                autoFocus
              />
              
              {error && (
                <p className="text-red-500 text-sm mb-3 sm:mb-4 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </p>
              )}
              
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50 min-h-[44px] text-sm font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>

              {/* Refresh CAPTCHA link */}
              <button
                onClick={loadCaptcha}
                disabled={loadingCaptcha}
                className="w-full mt-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--primary)] transition disabled:opacity-50 min-h-[32px]"
              >
                {loadingCaptcha ? 'Loading...' : 'Get new challenge →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
