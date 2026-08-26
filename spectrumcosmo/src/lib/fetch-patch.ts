'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return originalFetch(`${API_BASE}${input}`, init);
    }
    
    if (input instanceof Request && input.url.startsWith('/api/')) {
      const url = `${API_BASE}${input.url}`;
      return originalFetch(new Request(url, input), init);
    }
    
    return originalFetch(input, init);
  };
}
