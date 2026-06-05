// lib/security/whitelist.ts
const WHITELIST_IPS = process.env.SECURITY_WHITELIST_IPS?.split(',') || [];

export function isWhitelisted(ip: string): boolean {
  return WHITELIST_IPS.includes(ip) || ip === '127.0.0.1' || ip === '::1';
}
