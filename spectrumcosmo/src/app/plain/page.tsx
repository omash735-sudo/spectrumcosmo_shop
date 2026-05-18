// src/app/plain/page.tsx
export default function PlainPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Plain Page (No Providers)</h1>
      <p>If you can see this, React is working.</p>
      <button
        onClick={async () => {
          const res = await fetch('/api/auth/me');
          const text = await res.text();
          alert('Response: ' + text.slice(0, 200));
        }}
        style={{ padding: '0.5rem 1rem', background: 'orange', border: 'none', borderRadius: '8px' }}
      >
        Test API
      </button>
    </div>
  );
}
