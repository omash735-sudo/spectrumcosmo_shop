export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock, MapPin, Users, ArrowRight, ExternalLink, Video, Calendar, Tag, Sparkles } from 'lucide-react';
import { getDb, queryMany, queryOne } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

interface SiteEvent {
  id: string;
  badge: string;
  title: string;
  detail: string;
  href: string;
  google_form_link?: string;
  poster_image_url?: string;
  poster_image_url_dark?: string;
  registration_required: boolean;
  registration_form_url?: string;
  registration_deadline?: Date;
  max_attendees?: number;
  current_attendees?: number;
  location?: string;
  venue?: string;
  is_online_event: boolean;
  event_date?: Date;
  event_end_date?: Date;
  featured: boolean;
  event_type: string;
  starts_at?: Date;
  ends_at?: Date;
}

export default async function EventsPage() {
  let events: SiteEvent[] = [];
  let featuredEvent: SiteEvent | null = null;

  try {
    const sql = getDb();
    
    // Get featured event first
    featuredEvent = await queryOne<SiteEvent>`
      SELECT * FROM site_events 
      WHERE active = true 
        AND featured = true
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY event_date DESC
      LIMIT 1
    `;

    // Get all other events
    events = await queryMany<SiteEvent>`
      SELECT * FROM site_events 
      WHERE active = true 
        AND (ends_at IS NULL OR ends_at >= NOW())
        AND featured = false
      ORDER BY event_date DESC
    `;

    // If no featured event, just get all events
    if (!featuredEvent) {
      events = await queryMany<SiteEvent>`
        SELECT * FROM site_events 
        WHERE active = true 
          AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY event_date DESC
      `;
    }
  } catch (err) {
    console.error('Events page DB error:', err);
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const EventCard = ({ event, featured = false }: { event: SiteEvent; featured?: boolean }) => {
    const isRegistrationOpen = !event.registration_deadline || new Date(event.registration_deadline) > new Date();
    const hasAvailableSpots = !event.max_attendees || (event.current_attendees || 0) < event.max_attendees;
    const canRegister = event.registration_required && isRegistrationOpen && hasAvailableSpots;

    return (
      <div className={`${featured ? 'col-span-full' : ''}`}>
        <div className={`
          rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1
          ${featured 
            ? 'bg-gradient-to-br from-orange-50 to-white dark:from-gray-800 dark:to-gray-900 border-orange-200 dark:border-orange-800' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }
        `}>
          {/* Poster Image */}
          {event.poster_image_url && (
            <div className="relative w-full aspect-[16/9] bg-gray-100 dark:bg-gray-800">
              <Image
                src={event.poster_image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
              {event.featured && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles size={12} />
                  Featured Event
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            {/* Badge & Type */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">
                {event.badge}
              </span>
              {event.event_type && (
                <span className="text-xs uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full">
                  {event.event_type}
                </span>
              )}
              {event.is_online_event && (
                <span className="text-xs uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full flex items-center gap-1">
                  <Video size={12} />
                  Online
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className={`font-bold mb-2 ${featured ? 'text-2xl' : 'text-xl'} text-gray-900 dark:text-white`}>
              {event.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {event.detail}
            </p>

            {/* Event Details */}
            <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              {event.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500 flex-shrink-0" />
                  <span>{formatDate(event.event_date)}</span>
                  {event.event_end_date && (
                    <span> - {formatDate(event.event_end_date)}</span>
                  )}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                  <span>{event.location}</span>
                  {event.venue && <span className="text-gray-400">• {event.venue}</span>}
                </div>
              )}
              {event.max_attendees && (
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-orange-500 flex-shrink-0" />
                  <span>
                    {event.current_attendees || 0} / {event.max_attendees} attendees
                    {event.current_attendees && event.current_attendees >= event.max_attendees && (
                      <span className="text-red-500 ml-2">(Full)</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Registration Button */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {event.registration_required && canRegister && (
                event.registration_form_url ? (
                  <a
                    href={event.registration_form_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex-1"
                  >
                    Register Now <ExternalLink size={14} />
                  </a>
                ) : (
                  <Link
                    href={`/events/register/${event.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex-1"
                  >
                    Register Now <ArrowRight size={14} />
                  </Link>
                )
              )}
              
              {event.registration_required && !canRegister && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {!isRegistrationOpen ? 'Registration Closed' : 'Event Full'}
                </div>
              )}

              <Link
                href={event.href || `/events/${event.id}`}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex-1"
              >
                Learn More <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-900 pt-8 md:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
              Stay Updated
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-2">
              Events & Announcements
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
              Discover upcoming events, product drops, and exclusive offers from SpectrumCosmo
            </p>
          </div>

          {/* Events Grid */}
          {featuredEvent && (
            <div className="mb-8">
              <EventCard event={featuredEvent} featured={true} />
            </div>
          )}

          {events && events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : !featuredEvent && (
            <div className="text-center py-20">
              <CalendarDays size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Events Right Now
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Check back soon for upcoming events and announcements!
              </p>
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
