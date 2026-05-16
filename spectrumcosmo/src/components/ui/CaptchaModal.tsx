'use client';

import { useState } from 'react';
import { X, Shield } from 'lucide-react';

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

  const loadCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaToken(data.token);
      setCaptchaChallenge(data.challenge);
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
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
      loadCaptcha(); // Load new CAPTCHA
      setCaptchaAnswer('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-[#F97316]" />
            <h2 className="text-lg font-semibold">Security Verification</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Multiple failed login attempts detected. Please complete the verification below.
          </p>
          
          {!captchaToken ? (
            <button
              onClick={loadCaptcha}
              className="w-full py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600"
            >
              Load CAPTCHA
            </button>
          ) : (
            <>
              <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                <p className="text-lg font-mono">{captchaChallenge}</p>
              </div>
              
              <input
                type="text"
                placeholder="Enter your answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
              
              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}
              
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
