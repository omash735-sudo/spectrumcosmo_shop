'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MailOpen, MailX, Users, Send } from 'lucide-react';

// Types
type Campaign = {
  id: number;
  title: string;
  status: string;
  audience: string;
  open_count: number;
  click_count: number;
  created_at: string;
  total_subscribers: number;
};

type StatData = {
  totalActive: number;
  growth: { month: string; new: number }[];
  performance: any[];
  unsubscribes: any[];
};

// Props received from the parent server component
interface NewsletterClientProps {
  initialCampaigns: Campaign[];
  initialStats?: StatData | null;
}

export default function NewsletterClient({ initialCampaigns, initialStats = null }: NewsletterClientProps) {
  const [stats, setStats] = useState<StatData | null>(initialStats);
  const [campaigns] = useState<Campaign[]>(initialCampaigns);

  useEffect(() => {
    // Only fetch stats on the client if they are not provided initially
    if (!stats) {
      fetch('/api/admin/newsletter/stats')
        .then(res => res.json())
        .then(setStats)
        .catch(console.error);
    }
  }, [stats]);

  return (
    <>
      {/* Dashboard Section */}
      {stats && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-10">
            <h2 className="font-bold text-gray-800 mb-4">📊 Analytics & Performance</h2>
            <NewsletterPerformance stats={stats} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-10">
            <h2 className="font-bold text-gray-800 mb-4">📈 Subscriber Growth (Last 12 Months)</h2>
            <SubscriberGrowthChart growthData={stats.growth} />
          </div>
        </>
      )}

      {/* Campaign Manager */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#111111]">📬 All Campaigns</h2>
          <Link href="/admin/newsletter/new" className="bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm font-medium">
            + Create Newsletter
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No newsletters created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Audience</th>
                  <th className="px-6 py-3">Open / Click</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((campaign) => {
                  const total = campaign.total_subscribers || 1;
                  const open = campaign.open_count || 0;
                  const click = campaign.click_count || 0;
                  const openRate = campaign.status === 'sent' ? ((open / total) * 100).toFixed(1) : '-';
                  const clickRate = campaign.status === 'sent' ? ((click / total) * 100).toFixed(1) : '-';
                  const statsDisplay = campaign.status === 'sent' && total > 0
                    ? `${open} / ${click} (${openRate}% / ${clickRate}%)`
                    : '-';

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-sm">{campaign.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {campaign.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.audience || 'all'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{statsDisplay}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">{new Date(campaign.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link href={`/admin/newsletter/${campaign.id}`} className="bg-gray-800 text-white px-3 py-1 rounded text-xs">Preview</Link>
                        {campaign.status !== 'sent' && (
                          <button
                            onClick={async () => {
                              await fetch('/api/newsletter/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaign.id }) });
                              window.location.reload();
                            }}
                            className="bg-[#F97316] text-white px-3 py-1 rounded text-xs">
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
    </>
  );
}

// --- Sub-components (stay as client components) ---

function SubscriberGrowthChart({ growthData }: { growthData: { month: string; new: number }[] }) {
  const [data, setData] = useState(growthData);
  useEffect(() => {
    if (!data || data.length === 0) {
      fetch('/api/admin/newsletter/stats')
        .then(res => res.json())
        .then(json => setData(json.growth || []))
        .catch(console.error);
    }
  }, [data]);
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm">No subscriber data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="new" fill="#F97316" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NewsletterPerformance({ stats }: { stats: StatData }) {
  const { totalActive, performance, unsubscribes } = stats;

  return (
    <div className="space-y-8">
      {/* Top stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
          <Users className="text-[#F97316]" size={24} />
          <div>
            <p className="text-2xl font-bold">{totalActive.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Active Subscribers</p>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
          <Send className="text-[#F97316]" size={24} />
          <div>
            <p className="text-2xl font-bold">{performance.length}</p>
            <p className="text-xs text-gray-500">Campaigns Sent</p>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
          <MailOpen className="text-[#F97316]" size={24} />
          <div>
            <p className="text-2xl font-bold">{performance.reduce((acc, c) => acc + (c.open_count || 0), 0)}</p>
            <p className="text-xs text-gray-500">Total Opens</p>
          </div>
        </div>
      </div>

      {/* Campaign performance table */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MailOpen size={18} /> Campaign Performance</h3>
        {performance.length === 0 ? (
          <p className="text-gray-400 text-sm">No campaigns sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr><th className="text-left px-4 py-2">Title</th><th className="text-left px-4 py-2">Sent</th><th className="text-left px-4 py-2">Open</th><th className="text-left px-4 py-2">Click</th></tr>
              </thead>
              <tbody>
                {performance.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{c.title}</td>
                    <td className="px-4 py-2 text-gray-500">{new Date(c.sent_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{c.open_count} ({c.open_rate}%)</td>
                    <td className="px-4 py-2">{c.click_count} ({c.click_rate}%)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent unsubscribes */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MailX size={18} /> Recent Unsubscribes</h3>
        {unsubscribes.length === 0 ? (
          <p className="text-gray-400 text-sm">No unsubscribes recorded.</p>
        ) : (
          <div className="space-y-2">
            {unsubscribes.map((u, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700">{u.email}</p>
                <p className="text-gray-500 text-xs">Reason: {u.reason || 'Not provided'}</p>
                {u.details && <p className="text-gray-400 text-xs mt-1">"{u.details}"</p>}
                <p className="text-gray-400 text-xs mt-1">{new Date(u.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
