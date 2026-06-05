// app/admin/newsletter/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import NewsletterClient from '@/components/admin/NewsletterClient';
import type { Campaign } from '@/types/newsletter';

// Types
interface CampaignWithSubscribers extends Campaign {
  total_subscribers: number;
}

export default async function AdminNewsletterPage() {
  // Authentication check
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  
  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  let campaigns: CampaignWithSubscribers[] = [];
  let error: string | null = null;

  try {
    const sql = getDb();
    const result = await sql`
      SELECT 
        c.*,
        COALESCE(
          (SELECT COUNT(*) FROM subscribers WHERE status = 'confirmed'),
          0
        ) as total_subscribers
      FROM newsletter_campaigns c
      ORDER BY c.created_at DESC
      LIMIT 50
    `;
    
    campaigns = result as CampaignWithSubscribers[];
  } catch (err) {
    console.error('Failed to fetch newsletter campaigns:', err);
    error = 'Unable to load campaigns. Please try again later.';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Hub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage campaigns, view analytics, and track subscriber engagement.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          // Error State
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 text-red-500">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Failed to Load Campaigns
            </h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <NewsletterClient initialCampaigns={campaigns} />
        )}
      </div>
    </div>
  );
}
