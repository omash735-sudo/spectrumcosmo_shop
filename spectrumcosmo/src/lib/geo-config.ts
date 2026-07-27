export const COUNTRY_CURRENCY_MAP: Record<string, { 
  code: string; 
  currency: string; 
  flag: string; 
  label: string 
}> = {
  MW: { code: 'MW', currency: 'MWK', flag: '🇲🇼', label: 'Malawi' },
  US: { code: 'US', currency: 'USD', flag: '🇺🇸', label: 'United States' },
  ZA: { code: 'ZA', currency: 'ZAR', flag: '🇿🇦', label: 'South Africa' },
  NG: { code: 'NG', currency: 'NGN', flag: '🇳🇬', label: 'Nigeria' },
  GB: { code: 'GB', currency: 'GBP', flag: '🇬🇧', label: 'United Kingdom' },
  KE: { code: 'KE', currency: 'KES', flag: '🇰🇪', label: 'Kenya' },
  TZ: { code: 'TZ', currency: 'TZS', flag: '🇹🇿', label: 'Tanzania' },
  ZM: { code: 'ZM', currency: 'ZMW', flag: '🇿🇲', label: 'Zambia' },
  ZW: { code: 'ZW', currency: 'ZWL', flag: '🇿🇼', label: 'Zimbabwe' },
};

export const DEFAULT_CURRENCY = 'MWK';
export const DEFAULT_COUNTRY = 'MW';
