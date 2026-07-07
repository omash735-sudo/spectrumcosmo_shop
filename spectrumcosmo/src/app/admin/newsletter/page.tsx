// app/admin/newsletter/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 60;

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import NewsletterClient from '@/components/admin/NewsletterClient';
import { AlertCircle, RefreshCw, Plus, Users, Mail } from 'lucide-react';
import Link from 'next/link';

// Local types matching the client component
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

interface NewsletterStats {
  totalSubscribers: number;
  totalCampaigns: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalUnsubscribes: number;
  subscriberGrowth: number;
}

export const metadata: Metadata = {
  title: 'Newsletter Hub | Admin Dashboard | SpectrumCosmo',
  description: 'Manage email campaigns, track subscriber engagement, and view newsletter analytics.',
  robots: 'noindex, nofollow',
};

async function getNewsletterStats(sql: any): Promise<NewsletterStats> {
  try {
    const [subscriberCount] = await sql`
      SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'
    `;
    
    const [campaignCount] = await sql`
      SELECT COUNT(*) as count FROM newsletter_campaigns
    `;
    
    const [avgStats] = await sql`
      SELECT 
        AVG(CASE WHEN total_subscribers > 0 THEN (open_count::float / total_subscribers * 100) ELSE 0 END) as avg_open_rate,
        AVG(CASE WHEN open_count > 0 THEN (click_count::float / open_count * 100) ELSE 0 END) as avg_click_rate,
        COALESCE(SUM(unsubscribe_count), 0) as total_unsubscribes
      FROM newsletter_campaigns
      WHERE status = 'sent' AND total_subscribers > 0
    `;
    
    // Calculate growth (compare to last month)
    const [growth] = await sql`
      SELECT 
        COUNT(*) as current_count
      FROM subscribers 
      WHERE status = 'confirmed' AND created_at > NOW() - INTERVAL '30 days'
    `;
    
    return {
      totalSubscribers: Number(subscriberCount?.count) || 0,
      totalCampaigns: Number(campaignCount?.count) || 0,
      averageOpenRate: Math.round(Number(avgStats?.avg_open_rate) || 0),
      averageClickRate: Math.round(Number(avgStats?.avg_click_rate) || 0),
      totalUnsubscribes: Number(avgStats?.total_unsubscribes) || 0,
      subscriberGrowth: Math.round((Number(growth?.current_count) || 0) / Math.max(Number(subscriberCount?.count) || 1, 1) * 100),
    };
  } catch {
    return {
      totalSubscribers: 0,
      totalCampaigns: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
      totalUnsubscribes: 0,
      subscriberGrowth: 0,
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
  let stats: NewsletterStats | null = null;
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
            initialStats={stats || undefined}
          />
        )}
      </div>
    </div>
  );
}
