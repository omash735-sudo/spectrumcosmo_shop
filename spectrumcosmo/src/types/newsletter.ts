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
