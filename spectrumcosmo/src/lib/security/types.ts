// lib/security/types.ts
export interface SecurityRule {
  enabled: boolean;
  max_requests?: number;
  window_seconds?: number;
  block_minutes?: number;
  max_attempts?: number;
  window_hours?: number;
  risk_threshold?: number;
}

export interface SecurityRules {
  rate_limiting: SecurityRule;
  suspicious_activity: SecurityRule;
  checkout_protection: SecurityRule;
  bot_detection: SecurityRule;
  auto_block: SecurityRule;
  admin_protection: SecurityRule;
}

export interface SecurityLogPayload {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  details?: Record<string, unknown>;
}

export interface SessionPayload {
  sessionId: string;
  userId: string | null;
  pageUrl: string;
  userAgent: string;
  ipAddress: string;
  referrer: string;
}
