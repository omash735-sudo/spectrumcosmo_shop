// types/payment.ts

// ============================================
// PAYMENT METHOD TYPES
// ============================================

export type PaymentMethodType = 'mobile_money' | 'bank' | 'cash' | 'card';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
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
  type: PaymentMethodType;
  logo_url?: string;
  account_number?: string;
  branch?: string;
  instructions?: string;
}

export interface PaymentMethodStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    mobile_money: number;
    bank: number;
    cash: number;
    card: number;
  };
}

// ============================================
// PAYMENT RECORD TYPES
// ============================================

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'refunded' | 'failed';

export interface PaymentRecord {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string | null;
  phone_number: string | null;
  payment_method: string;
  payment_method_type: PaymentMethodType;
  total_amount: number;
  status: PaymentStatus;
  transaction_id: string | null;
  onekhusa_transaction_id: string | null;
  reference_number: string | null;
  payment_proof_url: string | null;
  notes: string | null;
  processed_by: string | null;
  processed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentRecordFilters {
  status?: PaymentStatus;
  payment_method?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentRecordStats {
  totalCount: number;
  totalAmount: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  declinedCount: number;
  declinedAmount: number;
  refundedCount: number;
  refundedAmount: number;
  averageOrderValue: number;
  successRate: number;
}

// ============================================
// PAYMENT TRANSACTION TYPES
// ============================================

export interface PaymentTransaction {
  id: string;
  payment_record_id: string;
  action: 'created' | 'updated' | 'approved' | 'declined' | 'refunded';
  previous_status: PaymentStatus | null;
  new_status: PaymentStatus;
  changed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: Date;
}

// ============================================
// PAYMENT WEBHOOK TYPES
// ============================================

export interface PaymentWebhookPayload {
  event: 'payment.success' | 'payment.failed' | 'payment.pending' | 'payment.refunded';
  transaction_id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaymentStatusConfig {
  label: string;
  icon: any;
  className: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

export interface PaymentMethodOption {
  value: PaymentMethodType;
  label: string;
  icon: any;
  description: string;
}

// Status configuration for UI
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> = {
  pending: {
    label: 'Pending',
    icon: 'Clock',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    darkBgColor: 'dark:bg-yellow-950/30',
  },
  approved: {
    label: 'Approved',
    icon: 'CheckCircle',
    className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
    color: 'green',
    bgColor: 'bg-green-50',
    darkBgColor: 'dark:bg-green-950/30',
  },
  declined: {
    label: 'Declined',
    icon: 'XCircle',
    className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
    color: 'red',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-950/30',
  },
  refunded: {
    label: 'Refunded',
    icon: 'RefreshCw',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
    color: 'purple',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-950/30',
  },
  failed: {
    label: 'Failed',
    icon: 'AlertCircle',
    className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
    color: 'red',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-950/30',
  },
};

// Payment method options for forms
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    icon: 'Smartphone',
    description: 'Airtel Money, MPesa, etc.',
  },
  {
    value: 'bank',
    label: 'Bank Transfer',
    icon: 'Building',
    description: 'Direct bank transfer',
  },
  {
    value: 'cash',
    label: 'Cash on Delivery',
    icon: 'Banknote',
    description: 'Pay when you receive',
  },
  {
    value: 'card',
    label: 'Credit/Debit Card',
    icon: 'CreditCard',
    description: 'Visa, Mastercard, etc.',
  },
];

// Helper function to get payment method label
export function getPaymentMethodLabel(type: PaymentMethodType): string {
  const option = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === type);
  return option?.label || type.replace('_', ' ');
}

// Helper function to format currency
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date
export function formatPaymentDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper to calculate payment stats from records
export function calculatePaymentStats(records: PaymentRecord[]): PaymentRecordStats {
  const totalAmount = records.reduce((sum, r) => sum + r.total_amount, 0);
  const approvedAmount = records
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.total_amount, 0);
  const pendingAmount = records
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.total_amount, 0);
  const declinedAmount = records
    .filter(r => r.status === 'declined')
    .reduce((sum, r) => sum + r.total_amount, 0);
  const refundedAmount = records
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + r.total_amount, 0);

  const approvedCount = records.filter(r => r.status === 'approved').length;
  const totalNonFailed = records.filter(r => r.status !== 'failed').length;

  return {
    totalCount: records.length,
    totalAmount,
    pendingCount: records.filter(r => r.status === 'pending').length,
    pendingAmount,
    approvedCount,
    approvedAmount,
    declinedCount: records.filter(r => r.status === 'declined').length,
    declinedAmount,
    refundedCount: records.filter(r => r.status === 'refunded').length,
    refundedAmount,
    averageOrderValue: records.length > 0 ? totalAmount / records.length : 0,
    successRate: totalNonFailed > 0 ? (approvedCount / totalNonFailed) * 100 : 0,
  };
}
