// app/admin/newsletter/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 60;

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import NewsletterClient from '@/components/admin/NewsletterClient';
import { AlertCircle, RefreshCw, Plus, Mail } from 'lucide-react';
import Link from 'next/link';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
type AudienceType = 'all' | 'active' | 'inactive' | 'segment';

interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  audience: AudienceType;
  open_count: number;
  click_count: number;
  unsubscribe_count: number;
  created_at: string;
  sent_at?: string | null;
  scheduled_for?: string | null;
  total_subscribers: number;
  segment_name?: string | null;
}

interface CampaignPerformance {
  id: string;
  title: string;
  sent_at: string;
  open_count: number;
  click_count: number;
  open_rate: number;
  click_rate: number;
  total_subscribers: number;
}

interface UnsubscribeLog {
  id: string;
  email: string;
  reason: string;
  created_at: string;
}

interface StatData {
  totalSubscribers: number;
  totalCampaigns: number;
  averageOpenRate: number;
  totalActive: number;
  growth: { month: string; new: number }[];
  performance: CampaignPerformance[];
  unsubscribes: UnsubscribeLog[];
}

export const metadata: Metadata = {
  title: 'Newsletter Hub | Admin Dashboard | SpectrumCosmo',
  description: 'Manage email campaigns, track subscriber engagement, and view newsletter analytics.',
  robots: 'noindex, nofollow',
};

async function getNewsletterStats(sql: any): Promise<StatData> {
  try {
    const [subscriberCount] = await sql`
      SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'
    `;

    const [activeCount] = await sql`
      SELECT COUNT(*) as count FROM subscribers 
      WHERE status = 'confirmed' AND confirmed_at > NOW() - INTERVAL '90 days'
    `;

    const [campaignCount] = await sql`
      SELECT COUNT(*) as count FROM newsletter_campaigns
    `;

    const [avgStats] = await sql`
      SELECT 
        AVG(open_count) as avg_open_count,
        AVG(total_subscribers) as avg_total_subscribers
      FROM newsletter_campaigns
      WHERE status = 'sent' AND total_subscribers > 0
    `;

    let averageOpenRate = 0;
    if (avgStats?.avg_open_count && avgStats?.avg_total_subscribers) {
      averageOpenRate = Math.round((Number(avgStats.avg_open_count) / Number(avgStats.avg_total_subscribers)) * 100);
    }

    const campaignPerformance = await sql`
      SELECT 
        id,
        title,
        sent_at,
        open_count,
        click_count,
        total_subscribers
      FROM newsletter_campaigns
      WHERE status = 'sent' AND total_subscribers > 0
      ORDER BY sent_at DESC
      LIMIT 5
    `;

    const growthData = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as new_count
      FROM subscribers 
      WHERE status = 'confirmed' AND created_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    // Get unsubscribe logs - THIS IS THE FIX
    const unsubscribeLogs = await sql`
      SELECT 
        id,
        email,
        reason,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM unsubscribe_feedback
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const totalSubscribers = Number(subscriberCount?.count) || 0;
    const totalActive = Number(activeCount?.count) || 0;
    const totalCampaigns = Number(campaignCount?.count) || 0;

    const growth = (growthData || []).map((row: any) => ({
      month: row.month || 'No Data',
      new: Number(row.new_count) || 0,
    }));

    if (growth.length === 0) {
      growth.push({ month: 'No Data', new: 0 });
    }

    const performance = (campaignPerformance || []).map((row: any) => {
      const openCount = Number(row.open_count) || 0;
      const totalSubs = Number(row.total_subscribers) || 0;
      const clickCount = Number(row.click_count) || 0;

      const openRate = totalSubs > 0 ? Math.round((openCount / totalSubs) * 100) : 0;
      const clickRate = openCount > 0 ? Math.round((clickCount / openCount) * 100) : 0;

      return {
        id: row.id || '',
        title: row.title || 'Untitled',
        sent_at: row.sent_at || '',
        open_count: openCount,
        click_count: clickCount,
        open_rate: openRate,
        click_rate: clickRate,
        total_subscribers: totalSubs,
      };
    });

    const unsubscribes = (unsubscribeLogs || []).map((row: any) => ({
      id: row.id || '',
      email: row.email || '',
      reason: row.reason || 'No reason provided',
      created_at: row.created_at || '',
    }));

    return {
      totalSubscribers,
      totalCampaigns,
      averageOpenRate,
      totalActive,
      growth,
      performance,
      unsubscribes,
    };
  } catch (error) {
    console.error('Stats error:', error);
    return {
      totalSubscribers: 0,
      totalCampaigns: 0,
      averageOpenRate: 0,
      totalActive: 0,
      growth: [{ month: 'No Data', new: 0 }],
      performance: [],
      unsubscribes: [],
    };
  }
}

export default async function AdminNewsletterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  let campaigns: Campaign[] = [];
  let stats: StatData | null = null;
  let error: string | null = null;

  try {
    const sql = getDb();

    const [campaignsResult, statsResult] = await Promise.all([
      sql`
        SELECT 
          c.id,
          c.title,
          c.status,
          c.audience,
          COALESCE(c.open_count, 0) as open_count,
          COALESCE(c.click_count, 0) as click_count,
          COALESCE(c.unsubscribe_count, 0) as unsubscribe_count,
          c.created_at,
          c.sent_at,
          c.scheduled_for,
          c.segment_name,
          COALESCE(
            (SELECT COUNT(*) FROM subscribers WHERE status = 'confirmed'),
            0
          ) as total_subscribers
        FROM newsletter_campaigns c
        ORDER BY c.created_at DESC
        LIMIT 50
      `,
      getNewsletterStats(sql),
    ]);

    campaigns = campaignsResult as Campaign[];
    stats = statsResult;
  } catch (err) {
    console.error('Failed to fetch newsletter data:', err);
    error = err instanceof Error ? err.message : 'Unable to load newsletter data. Please try again later.';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-7 h-7 text-orange-500" />
                Newsletter Hub
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage campaigns, target audiences, and track subscriber engagement.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin/newsletter/new"
                className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition shadow-md text-sm"
              >
                <Plus size={18} />
                Create Newsletter
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Unable to Load Newsletter Data
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">
              {error}
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm"
              >
                Return to Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <NewsletterClient
            initialCampaigns={campaigns}
            initialStats={stats}
          />
        )}
      </div>
    </div>
  );
}
