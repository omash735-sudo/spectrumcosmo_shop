// types/payment.ts
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank' | 'cash' | 'card';
  logo_url: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMethodFormData {
  name: string;
  type: PaymentMethod['type'];
  logo_url?: string;
  account_number?: string;
  branch?: string;
  instructions?: string;
}
