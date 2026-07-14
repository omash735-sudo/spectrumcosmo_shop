'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function TrackVisits() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && !pathname.startsWith('/api')) {
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_url: pathname }),
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
