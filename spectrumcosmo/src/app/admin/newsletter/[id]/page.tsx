export const dynamic = 'force-dynamic';

import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, Clock, Users, Eye, MousePointer } from 'lucide-react';
import { format } from 'date-fns';

export default async function NewsletterPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  const sql = getDb();

  const [newsletter] = await sql`
    SELECT 
      id,
      title,
      content,
      image_url,
      audience,
      status,
      open_count,
      click_count,
      unsubscribe_count,
      total_subscribers,
      created_at,
      sent_at,
      scheduled_for,
      segment_name
    FROM newsletter_campaigns 
    WHERE id = ${id}
  `;

  if (!newsletter) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Newsletter Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The newsletter you are looking for does not exist or has been deleted.</p>
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Newsletter Hub
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
      scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      sending: { label: 'Sending...', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      sent: { label: 'Sent', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };
    const c = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.color}`}>
        {c.label}
      </span>
    );
  };

  const getAudienceLabel = (audience: string) => {
    const config: Record<string, string> = {
      all: 'All Subscribers',
      active: 'Active Subscribers',
      segment: 'Custom Segment',
    };
    return config[audience] || audience;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <Link
          href="/admin/newsletter"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Newsletter Hub
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {newsletter.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {getStatusBadge(newsletter.status)}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getAudienceLabel(newsletter.audience)}
                </span>
                {newsletter.segment_name && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Segment: {newsletter.segment_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {newsletter.status === 'draft' && (
                <form
                  action={async () => {
                    'use server';
                    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/send`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        id: newsletter.id,
                        send_now: true 
                      }),
                    });
                    redirect('/admin/newsletter');
                  }}
                >
                  <button
                    type="submit"
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send Now
                  </button>
                </form>
              )}
              {newsletter.status === 'draft' && (
                <Link
                  href={`/admin/newsletter/${newsletter.id}/edit`}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                >
                  Edit
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {format(new Date(newsletter.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            {newsletter.sent_at && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(newsletter.sent_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            )}
            {newsletter.scheduled_for && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled For</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(newsletter.scheduled_for), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recipients</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {newsletter.total_subscribers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {newsletter.status === 'sent' && (
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <Eye size={16} />
                <span className="text-sm">Opens</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {newsletter.open_count}
              </p>
              <p className="text-xs text-gray-400">
                {newsletter.total_subscribers > 0 
                  ? Math.round((newsletter.open_count / newsletter.total_subscribers) * 100) 
                  : 0}% rate
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <MousePointer size={16} />
                <span className="text-sm">Clicks</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {newsletter.click_count}
              </p>
              <p className="text-xs text-gray-400">
                {newsletter.open_count > 0 
                  ? Math.round((newsletter.click_count / newsletter.open_count) * 100) 
                  : 0}% CTR
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <Users size={16} />
                <span className="text-sm">Unsubscribes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {newsletter.unsubscribe_count || 0}
              </p>
              <p className="text-xs text-gray-400">
                {newsletter.total_subscribers > 0 
                  ? Math.round(((newsletter.unsubscribe_count || 0) / newsletter.total_subscribers) * 100) 
                  : 0}% rate
              </p>
            </div>
          </div>
        )}

        <div className="p-6">
          {newsletter.image_url && (
            <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={newsletter.image_url}
                alt={newsletter.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div
            className="prose max-w-none dark:prose-invert prose-orange"
            dangerouslySetInnerHTML={{ __html: newsletter.content }}
          />
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Newsletter ID: {newsletter.id}
            </p>
            {newsletter.status === 'draft' && (
              <form
                action={async () => {
                  'use server';
                  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      id: newsletter.id,
                      send_now: true 
                    }),
                  });
                  redirect('/admin/newsletter');
                }}
              >
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition flex items-center gap-2"
                >
                  <Send size={16} />
                  Send Now
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
