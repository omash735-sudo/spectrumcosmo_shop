'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, X } from 'lucide-react';

interface SiteEvent {
  id: string;
  badge: string;
  title: string;
  detail: string;
  href: string;
  startsAt?: string;
  endsAt?: string;
}

// EDIT THIS ARRAY TO MANAGE EVENTS
// For admin management, replace with API fetch below
const events: SiteEvent[] = [
  // Example events - remove or modify as needed
  // {
  //   id: 'jersey-restock-2026-07',
  //   badge: 'RESTOCK',
  //   title: 'Anime Jersey restock is back',
  //   detail: 'New designs land 18 July — limited quantities.',
  //   href: '/events',
  //   startsAt: '2026-07-01',
  //   endsAt: '2026-07-25',
  // },
];

function getActiveEvent(): SiteEvent | null {
  const now = Date.now();
  const active = events.filter((e) => {
    const started = !e.startsAt || new Date(e.startsAt).getTime() <= now;
    const notEnded = !e.endsAt || new Date(e.endsAt).getTime() >= now;
    return started && notEnded;
  });
  return active[0] ?? null;
}

const DISMISS_KEY = 'sc_announcement_dismissed';

export default function EventAnnouncementBar() {
  const [event, setEvent] = useState<SiteEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const active = getActiveEvent();
    if (!active) return;

    const dismissed = typeof window !== 'undefined'
      ? window.localStorage.getItem(DISMISS_KEY)
      : null;

    if (dismissed === active.id) return;

    setEvent(active);
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (!event) return null;

  const handleDismiss = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, event.id);
    setTimeout(() => setEvent(null), 250);
  };

  return (
    <div
      className={`relative z-[60] bg-gray-900 text-white overflow-hidden transition-all duration-300 ease-out ${
        visible ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-4">
        <span className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex-shrink-0">
          <CalendarDays size={16} />
        </span>

        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full flex-shrink-0">
            {event.badge}
          </span>
          <span className="text-sm sm:text-[15px] font-semibold truncate">
            {event.title}
          </span>
          <span className="hidden sm:inline text-sm text-gray-400 truncate">
            — {event.detail}
          </span>
        </div>

        <Link
          href={event.href}
          className="group flex-shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
        >
          Learn more
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="flex-shrink-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
