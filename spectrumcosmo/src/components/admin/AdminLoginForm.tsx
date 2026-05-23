// components/admin/AdminLoginForm.tsx
'use client';

import { useState } from 'react';

export function AdminLoginForm() {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = step === 'credentials' 
      ? { username, password }
      : { username, password, twoFactorCode };

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.status === 401 && data.requiresTwoFactor) {
      setStep('2fa');
      return;
    }

    if (res.ok) {
      window.location.href = '/admin/dashboard';
    } else {
      setError(data.error);
      if (step === '2fa') {
        setStep('credentials');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 'credentials' ? (
        <>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
          <input
            type="text"
            placeholder="2FA Code"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            className="w-full p-2 border rounded text-center text-2xl tracking-widest"
            maxLength={6}
            required
          />
        </>
      )}
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <button
        type="submit"
        className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
      >
        {step === 'credentials' ? 'Login' : 'Verify 2FA Code'}
      </button>
    </form>
  );
}
