// app/admin/newsletter/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import NewsletterClient from '@/components/admin/NewsletterClient';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Campaign } from '@/types/newsletter';
import Link from 'next/link';

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Newsletter Hub | Admin Dashboard | SpectrumCosmo',
  description: 'Manage email campaigns, track subscriber engagement, and view newsletter analytics.',
  robots: 'noindex, nofollow',
};

// Types
interface CampaignWithSubscribers extends Campaign {
  total_subscribers: number;
}

interface NewsletterStats {
  totalSubscribers: number;
  totalCampaigns: number;
  averageOpenRate: number;
}

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
        AVG(CASE WHEN total_subscribers > 0 THEN (open_count::float / total_subscribers * 100) ELSE 0 END) as avg_open_rate
      FROM newsletter_campaigns
      WHERE status = 'sent' AND total_subscribers > 0
    `;
    
    return {
      totalSubscribers: Number(subscriberCount?.count) || 0,
      totalCampaigns: Number(campaignCount?.count) || 0,
      averageOpenRate: Math.round(Number(avgStats?.avg_open_rate) || 0),
    };
  } catch {
    return {
      totalSubscribers: 0,
      totalCampaigns: 0,
      averageOpenRate: 0,
    };
  }
}

export default async function AdminNewsletterPage() {
  // Authentication check
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  
  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  let campaigns: CampaignWithSubscribers[] = [];
  let stats: NewsletterStats | null = null;
  let error: string | null = null;

  try {
    const sql = getDb();
    
    // Fetch campaigns and stats in parallel
    const [campaignsResult, statsResult] = await Promise.all([
      sql`
        SELECT 
          c.*,
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
    
    campaigns = campaignsResult as CampaignWithSubscribers[];
    stats = statsResult;
  } catch (err) {
    console.error('Failed to fetch newsletter data:', err);
    error = err instanceof Error ? err.message : 'Unable to load newsletter data. Please try again later.';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Hub</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage campaigns, view analytics, and track subscriber engagement.
              </p>
            </div>
            
            {/* Stats Summary in Header */}
            {stats && !error && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.totalSubscribers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Subscribers</p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.totalCampaigns}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Campaigns</p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.averageOpenRate}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Open Rate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          // Professional Error State
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
            initialStats={stats ? {
              totalActive: stats.totalSubscribers,
              growth: [],
              performance: [],
              unsubscribes: [],
            } : null}
          />
        )}
      </div>
    </div>
  );
}
