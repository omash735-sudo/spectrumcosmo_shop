// types/newsletter.ts

export interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  audience: 'all' | 'active' | 'inactive' | 'segment';
  scheduled_for: Date | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Database direct fields (for queries that don't join stats)
  open_count?: number;
  click_count?: number;
  // Aggregated stats (for detailed views)
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  total_subscribers?: number;
}

export interface CampaignStats {
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
}

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: 'pending' | 'confirmed' | 'unsubscribed' | 'bounced';
  subscribed_at: Date;
  confirmed_at: Date | null;
  unsubscribed_at: Date | null;
}

// Newsletter client expected type
export interface NewsletterCampaign {
  id: string;
  title: string;
  status: Campaign['status'];
  audience: Campaign['audience'];
  open_count: number;
  click_count: number;
  created_at: Date;
  sent_at: Date | null;
  total_subscribers: number;
}

export interface NewsletterStatsData {
  totalActive: number;
  growth: { month: string; new: number }[];
  performance: Array<{
    id: string;
    title: string;
    sent_at: string;
    open_count: number;
    click_count: number;
    open_rate: number;
    click_rate: number;
  }>;
  unsubscribes: Array<{
    email: string;
    reason: string | null;
    details: string | null;
    created_at: string;
  }>;
}
