'use client';

import { signIn } from 'next-auth/react';

export default function TestPage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Test Google Sign-In</h1>
      <button
        onClick={() => signIn('google', { redirectTo: '/account' })}
        style={{
          padding: '12px 24px',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Sign in with Google
      </button>
      <p style={{ marginTop: '20px', color: '#666' }}>
        This page uses the client-side signIn function directly.
      </p>
    </div>
  );
}
