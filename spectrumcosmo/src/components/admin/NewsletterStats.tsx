'use client';
import { useEffect, useState } from 'react';
import { Users, MailOpen, MailX } from 'lucide-react';

interface Campaign {
  id: number;
  title: string;
  sent_at: string;
  open_count: number;
  click_count: number;
  open_rate: string;
  click_rate: string;
}

interface Unsubscribe {
  email: string;
  reason: string;
  details: string;
  created_at: string;
}

export default function NewsletterStats() {
  const [totalActive, setTotalActive] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/newsletter/stats')
      .then(res => res.json())
      .then(data => {
        setTotalActive(data.totalActive || 0);
        setCampaigns(data.performance || []);
        setUnsubscribes(data.unsubscribes || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading newsletter stats...</div>;

  return (
    <div className="space-y-8">
      {/* Total Active Subscribers Card */}
      <div className="bg-orange-50 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
          <Users className="text-[#F97316]" size={24} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{totalActive.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Active Subscribers</p>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MailOpen size={18} /> Recent Campaigns
        </h3>
        {campaigns.length === 0 ? (
          <p className="text-gray-400 text-sm">No campaigns sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2">Sent</th>
                  <th className="text-left px-4 py-2">Open</th>
                  <th className="text-left px-4 py-2">Click</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
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

      {/* Recent Unsubscribes */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MailX size={18} /> Recent Unsubscribes
        </h3>
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
