export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Users, ArrowRight, ExternalLink } from 'lucide-react';
import { getDb, queryMany } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

interface SiteEvent {
  id: string;
  badge: string;
  title: string;
  detail: string;
  href: string;
  google_form_link?: string;
  starts_at?: Date;
  ends_at?: Date;
}

export default async function EventsPage() {
  let events: SiteEvent[] = [];

  try {
    const sql = getDb();
    events = await queryMany<SiteEvent>`
      SELECT * FROM site_events 
      WHERE active = true 
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY starts_at DESC
    `;
  } catch (err) {
    console.error('Events page DB error:', err);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-900 pt-8 md:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Stay Updated</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-2">Events & Announcements</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
              Discover upcoming events, product drops, and exclusive offers from SpectrumCosmo
            </p>
          </div>

          {/* Events Grid */}
          {events && events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">
                      {event.badge}
                    </span>
                    {event.starts_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(event.starts_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {event.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {event.detail}
                  </p>

                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {event.google_form_link && (
                      <a
                        href={event.google_form_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Register Now <ExternalLink size={14} />
                      </a>
                    )}
                    
                    <Link
                      href={event.href || '/events'}
                      className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                      Learn More <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <CalendarDays size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Events Right Now</h3>
              <p className="text-gray-500 dark:text-gray-400">Check back soon for upcoming events and announcements!</p>
              <Link href="/" className="inline-flex items-center gap-2 mt-6 text-orange-600 dark:text-orange-400 hover:underline">
                Return to Home <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
