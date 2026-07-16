export const dynamic = 'force-dynamic';

import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  Users, 
  Eye, 
  MousePointer,
  Calendar,
  User,
  Tag,
  AlertCircle,
  ChevronRight,
  Mail,
  CheckCircle,
  Sparkles,
  Info
} from 'lucide-react';
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Newsletter Not Found</h2>
          <p className="text-sm text-[var(--foreground-muted)] mb-6">
            The newsletter you are looking for does not exist or has been deleted.
          </p>
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition"
          >
            <ArrowLeft size={18} />
            Back to Newsletter Hub
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      draft: { 
        label: 'Draft', 
        color: 'text-gray-700 dark:text-gray-300', 
        bg: 'bg-gray-100 dark:bg-gray-800' 
      },
      scheduled: { 
        label: 'Scheduled', 
        color: 'text-blue-700 dark:text-blue-400', 
        bg: 'bg-blue-100 dark:bg-blue-950/30' 
      },
      sending: { 
        label: 'Sending...', 
        color: 'text-yellow-700 dark:text-yellow-400', 
        bg: 'bg-yellow-100 dark:bg-yellow-950/30' 
      },
      sent: { 
        label: 'Sent', 
        color: 'text-green-700 dark:text-green-400', 
        bg: 'bg-green-100 dark:bg-green-950/30' 
      },
      failed: { 
        label: 'Failed', 
        color: 'text-red-700 dark:text-red-400', 
        bg: 'bg-red-100 dark:bg-red-950/30' 
      },
    };
    const c = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${c.bg} ${c.color}`}>
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
          >
            <ArrowLeft size={16} />
            Back to Newsletter Hub
          </Link>
        </div>

        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)] flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] truncate">
                    {newsletter.title}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                  {getStatusBadge(newsletter.status)}
                  <span className="text-xs sm:text-sm text-[var(--foreground-muted)] flex items-center gap-1">
                    <Users size={12} className="sm:w-3.5 sm:h-3.5" />
                    {getAudienceLabel(newsletter.audience)}
                  </span>
                  {newsletter.segment_name && (
                    <span className="text-xs sm:text-sm text-[var(--foreground-muted)] flex items-center gap-1">
                      <Tag size={12} className="sm:w-3.5 sm:h-3.5" />
                      {newsletter.segment_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
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
                      className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm min-h-[44px]"
                    >
                      <Send size={16} />
                      Send Now
                    </button>
                  </form>
                )}
                {newsletter.status === 'draft' && (
                  <Link
                    href={`/admin/newsletter/${newsletter.id}/edit`}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition flex items-center gap-2 text-sm min-h-[44px] text-[var(--foreground)]"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Created</p>
                <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                  {format(new Date(newsletter.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              {newsletter.sent_at && (
                <div>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Sent</p>
                  <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                    {format(new Date(newsletter.sent_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
              {newsletter.scheduled_for && (
                <div>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Scheduled For</p>
                  <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                    {format(new Date(newsletter.scheduled_for), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)]">Recipients</p>
                <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                  {newsletter.total_subscribers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Stats (if sent) */}
          {newsletter.status === 'sent' && (
            <div className="grid grid-cols-3 gap-4 p-4 sm:p-6 bg-orange-50 dark:bg-orange-950/20 border-b border-[var(--border)]">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[var(--foreground-muted)]">
                  <Eye size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Opens</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  {newsletter.open_count}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                  {newsletter.total_subscribers > 0 
                    ? Math.round((newsletter.open_count / newsletter.total_subscribers) * 100) 
                    : 0}% rate
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[var(--foreground-muted)]">
                  <MousePointer size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Clicks</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  {newsletter.click_count}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                  {newsletter.open_count > 0 
                    ? Math.round((newsletter.click_count / newsletter.open_count) * 100) 
                    : 0}% CTR
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[var(--foreground-muted)]">
                  <Users size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Unsubscribes</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  {newsletter.unsubscribe_count || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                  {newsletter.total_subscribers > 0 
                    ? Math.round(((newsletter.unsubscribe_count || 0) / newsletter.total_subscribers) * 100) 
                    : 0}% rate
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6">
            {newsletter.image_url && (
              <div className="relative w-full h-48 sm:h-64 mb-4 sm:mb-6 rounded-xl overflow-hidden bg-[var(--background-secondary)]">
                <Image
                  src={newsletter.image_url}
                  alt={newsletter.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div
              className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground-muted)] prose-a:text-[var(--primary)] prose-strong:text-[var(--foreground)] prose-ul:text-[var(--foreground-muted)] prose-ol:text-[var(--foreground-muted)]"
              dangerouslySetInnerHTML={{ __html: newsletter.content }}
            />
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-[var(--border)] bg-[var(--background-secondary)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] font-mono">
              ID: {newsletter.id}
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
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition flex items-center gap-2 text-sm min-h-[44px] w-full sm:w-auto justify-center"
                >
                  <Send size={16} />
                  Send Now
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Pro Tip - Draft State */}
        {newsletter.status === 'draft' && (
          <div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                  <strong>Ready to send?</strong> Preview your newsletter content above, then click "Send Now" to deliver it to your audience.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 opacity-70">
                  Once sent, you cannot edit this newsletter. Make sure everything looks perfect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pro Tip - Sent State */}
        {newsletter.status === 'sent' && (
          <div className="mt-4 sm:mt-6 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400">
                  <strong>Newsletter sent!</strong> Track engagement metrics above including opens, clicks, and unsubscribe rates.
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 opacity-70">
                  Performance data updates in real-time as subscribers interact with your email.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
