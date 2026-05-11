export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';

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

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Newsletter</h1>
        <p className="text-gray-500 text-sm mt-1">Manage campaigns, preview content, and send emails.</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-400">{campaigns.length} campaigns</p>
        <Link href="/admin/newsletter/new" className="bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm font-medium">Create Newsletter</Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">All Campaigns</h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No newsletters created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Audience</th>
                  <th className="px-6 py-3 text-left">Open / Click</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((campaign) => {
                  const total = campaign.total_subscribers || 1;
                  const openRate = campaign.status === 'sent' ? ((campaign.open_count || 0) / total * 100).toFixed(1) : '0';
                  const clickRate = campaign.status === 'sent' ? ((campaign.click_count || 0) / total * 100).toFixed(1) : '0';
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-sm text-[#111111]">{campaign.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {campaign.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.audience || 'all'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {campaign.status === 'sent' ? `${campaign.open_count || 0} / ${campaign.click_count || 0} (${openRate}% / ${clickRate}%)` : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{new Date(campaign.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link href={`/admin/newsletter/${campaign.id}`} className="bg-gray-800 text-white px-3 py-1 rounded text-xs">Preview</Link>
                        {campaign.status !== 'sent' && (
                          <button
                            onClick={async () => {
                              await fetch('/api/newsletter/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaign.id }) });
                              window.location.reload();
                            }}
                            className="bg-[#F97316] text-white px-3 py-1 rounded text-xs"
                          >
                            Send
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
