// lib/types/order.ts

export type OrderStatus = 
  | 'pending' 
  | 'pending_quote' 
  | 'awaiting_verification' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'awaiting_verification' 
  | 'paid'
  | 'pending_products';

export type QuoteStatus = 
  | 'pending' 
  | 'quoted' 
  | 'paid';

export type DeliveryMethod = {
  id: number;
  name: string;
  logo_url: string | null;
  price: number;
  type: 'standard' | 'express';
  estimated_days: string | null;
  is_active: boolean;
  sort_order: number;
};

export type DeliveryArea = {
  id: number;
  area_name: string;
  city: string;
  base_fee: number;
  express_multiplier: number;
  estimated_days_standard: string | null;
  estimated_days_express: string | null;
  is_active: boolean;
};

export type ServiceabilityResponse = {
  isServiceable: boolean;
  area: DeliveryArea | null;
  baseFee: number | null;
  estimatedDays: string | null;
  defaultFee?: number;
  message: string | null;
  requiresQuote: boolean;
};

export type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
  custom_details?: string;
};

export type Order = {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_provider_id: number | null;
  delivery_method_id: number | null;
  delivery_fee: number;
  delivery_quote_status?: QuoteStatus | null;
  quoted_delivery_fee?: number | null;
  proof_of_payment_url?: string | null;
  payment_note?: string | null;
  tracking_number?: string | null;
  tracking_notes?: string | null;
  admin_notes?: string | null;
  promo_code?: string | null;
  promo_discount?: number | null;
  referral_code?: string | null;
  created_at: string;
  updated_at: string;
  delivered_at?: string | null;
  quote_requested_at?: string | null;
  items: OrderItem[];
};

export type PromoCode = {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  per_user_limit: number;
  expires_at: string | null;
  is_active: boolean;
};

export type PaymentProvider = {
  id: number;
  name: string;
  type: 'automatic' | 'manual';
  category: string;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
};

export type CheckoutFormData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  notes: string;
};

export type CheckoutState = {
  step: 1 | 2 | 3 | 4;
  form: CheckoutFormData;
  selectedDeliveryMethodId: number | null;
  selectedPaymentProvider: PaymentProvider | null;
  serviceability: ServiceabilityResponse | null;
  isCheckingServiceability: boolean;
  requiresQuote: boolean;
  quoteRequested: boolean;
  appliedPromo: PromoCode | null;
  discountAmount: number;
  referralCode: string | null;
  savedReferral: string | null;
  isSubmitting: boolean;
  error: string | null;
};
