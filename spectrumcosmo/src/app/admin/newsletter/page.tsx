export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import NewsletterClient from '@/components/admin/NewsletterClient';

export default async function AdminNewsletterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) redirect('/admin/login');

  const sql = getDb();
  const campaigns = await sql`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM subscribers WHERE status = 'confirmed') as total_subscribers
    FROM newsletter_campaigns c
    ORDER BY c.created_at DESC
  `;

  // Optional: Fetch initial stats here to avoid an extra client request
  // You can leave it null and let the client fetch them.
  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Newsletter Hub</h1>
        <p className="text-gray-500 text-sm mt-1">Manage campaigns, view analytics, and track subscriber engagement.</p>
      </div>
      <NewsletterClient initialCampaigns={campaigns} />
    </div>
  );
}
