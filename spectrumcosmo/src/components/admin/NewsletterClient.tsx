'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MailOpen, MailX, Users, Send, Plus, RefreshCw, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Types
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
type AudienceType = 'all' | 'active' | 'inactive' | 'segment';

interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  audience: AudienceType;
  open_count: number;
  click_count: number;
  created_at: string;
  sent_at?: string | null;
  total_subscribers: number;
}

interface CampaignPerformance {
  id: string;
  title: string;
  sent_at: string;
  open_count: number;
  click_count: number;
  open_rate: number;
  click_rate: number;
}

interface UnsubscribeLog {
  email: string;
  reason: string | null;
  details: string | null;
  created_at: string;
}

interface StatData {
  totalActive: number;
  growth: { month: string; new: number }[];
  performance: CampaignPerformance[];
  unsubscribes: UnsubscribeLog[];
}

interface NewsletterClientProps {
  initialCampaigns: Campaign[];
  initialStats?: StatData | null;
}

// Status badge component
function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
    sending: { label: 'Sending', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' },
    sent: { label: 'Sent', className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  };

  const { label, className } = config[status] || config.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Stat card component
function StatCard({ icon: Icon, title, value, color }: {
  icon: any;
  title: string;
  value: string | number;
  color: 'orange' | 'blue' | 'green';
}) {
  const colorClasses = {
    orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterClient({ initialCampaigns, initialStats = null }: NewsletterClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [stats, setStats] = useState<StatData | null>(initialStats);
  const [loadingStats, setLoadingStats] = useState(!initialStats);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats if not provided
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/newsletter/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setError(message);
      toast.error(message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleSendCampaign = useCallback(async (campaignId: string) => {
    setSendingId(campaignId);
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaignId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send campaign');
      }

      toast.success('Campaign sent successfully');
      
      // Update campaign status locally
      setCampaigns(prev =>
        prev.map(c =>
          c.id === campaignId ? { ...c, status: 'sent' as CampaignStatus } : c
        )
      );
      
      // Refresh stats
      await fetchStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send campaign';
      toast.error(message);
    } finally {
      setSendingId(null);
    }
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    await fetchStats();
    toast.success('Data refreshed');
  }, [fetchStats]);

  // Calculate derived stats
  const totalOpens = useMemo(() => {
    return stats?.performance?.reduce((acc, c) => acc + (c.open_count || 0), 0) || 0;
  }, [stats]);

  const totalCampaignsSent = stats?.performance?.length || 0;

  return (
    <div className="space-y-6">
      {/* Analytics Section */}
      {stats && (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics & Performance</h2>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                aria-label="Refresh stats"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <NewsletterPerformance stats={stats} totalOpens={totalOpens} totalCampaignsSent={totalCampaignsSent} />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              Subscriber Growth (Last 12 Months)
            </h2>
            <SubscriberGrowthChart growthData={stats.growth} />
          </div>
        </>
      )}

      {loadingStats && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Campaign Manager Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Campaigns</h2>
          <Link
            href="/admin/newsletter/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            Create Newsletter
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Send className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No campaigns yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your first newsletter campaign to engage with subscribers.
            </p>
            <Link
              href="/admin/newsletter/new"
              className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
            >
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Audience</th>
                  <th className="px-6 py-3 font-medium">Open / Click</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {campaigns.map((campaign) => {
                  const total = campaign.total_subscribers || 1;
                  const open = campaign.open_count || 0;
                  const click = campaign.click_count || 0;
                  const openRate = campaign.status === 'sent' ? ((open / total) * 100).toFixed(1) : '-';
                  const clickRate = campaign.status === 'sent' ? ((click / total) * 100).toFixed(1) : '-';
                  const statsDisplay = campaign.status === 'sent' && total > 0
                    ? `${open} / ${click} (${openRate}% / ${clickRate}%)`
                    : 'Not sent yet';

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {campaign.title}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={campaign.status} />
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {campaign.audience || 'All Subscribers'}
                       </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {statsDisplay}
                       </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(campaign.created_at).toLocaleDateString()}
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/newsletter/${campaign.id}`}
                            className="p-1.5 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 transition rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30"
                            aria-label="Preview"
                          >
                            <Eye size={16} />
                          </Link>
                          {campaign.status !== 'sent' && campaign.status !== 'sending' && (
                            <button
                              onClick={() => handleSendCampaign(campaign.id)}
                              disabled={sendingId === campaign.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                            >
                              {sendingId === campaign.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              Send
                            </button>
                          )}
                          {campaign.status === 'sending' && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">Sending...</span>
                          )}
                        </div>
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

// Subscriber Growth Chart Component
function SubscriberGrowthChart({ growthData }: { growthData: { month: string; new: number }[] }) {
  if (!growthData || growthData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <p className="text-sm">No subscriber growth data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={growthData}>
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            borderColor: '#E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${value} new subscribers`, 'Growth']}
        />
        <Bar dataKey="new" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Newsletter Performance Component
function NewsletterPerformance({ stats, totalOpens, totalCampaignsSent }: { 
  stats: StatData; 
  totalOpens: number; 
  totalCampaignsSent: number;
}) {
  const { totalActive, performance, unsubscribes } = stats;
  const avgOpenRate = totalCampaignsSent > 0
    ? (performance.reduce((acc, c) => acc + (c.open_rate || 0), 0) / totalCampaignsSent).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Active Subscribers" value={totalActive} color="orange" />
        <StatCard icon={Send} title="Campaigns Sent" value={totalCampaignsSent} color="blue" />
        <StatCard icon={MailOpen} title="Total Opens" value={totalOpens} color="green" />
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <MailOpen size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgOpenRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Open Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MailOpen size={18} className="text-orange-500" />
          Campaign Performance
        </h3>
        {performance.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No campaigns sent yet</p>
            <Link href="/admin/newsletter/new" className="inline-block mt-3 text-sm text-orange-500 hover:text-orange-600">
              Create your first campaign →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Sent Date</th>
                  <th className="px-4 py-3 font-medium">Open Rate</th>
                  <th className="px-4 py-3 font-medium">Click Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {performance.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {campaign.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(campaign.sent_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {campaign.open_rate}%
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({campaign.open_count} opens)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {campaign.click_rate}%
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({campaign.click_count} clicks)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Unsubscribes */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MailX size={18} className="text-orange-500" />
          Recent Unsubscribes
        </h3>
        {unsubscribes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No unsubscribes recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unsubscribes.slice(0, 10).map((unsubscribe, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white">{unsubscribe.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Reason: {unsubscribe.reason || 'Not provided'}
                </p>
                {unsubscribe.details && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    "{unsubscribe.details}"
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {new Date(unsubscribe.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
