// lib/services/orderService.ts
import { Order, CheckoutFormData, PromoCode, PaymentProvider } from '@/lib/types/order';

export type CreateOrderPayload = {
  customer_name: string;
  customer_email: string;
  phone_number: string;
  location: string;
  notes?: string | null;
  items: Array<{
    product_id?: string;
    product_name: string;
    quantity: number;
    price_usd: number;
    custom_details?: string;
  }>;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  delivery_method_id: number | null;
  payment_provider_id: number | null;
  payment_method: string;
  promo_code_id?: number | null;
  promo_code?: string | null;
  referral_code?: string | null;
};

export type QuoteRequestPayload = {
  customer_name: string;
  customer_email: string;
  phone_number: string;
  location: string;
  notes?: string | null;
  items: Array<{
    product_id?: string;
    product_name: string;
    quantity: number;
    price_usd: number;
    custom_details?: string;
  }>;
  subtotal: number;
  delivery_method_id: number | null;
  delivery_method_name?: string;
  payment_provider_id: number | null;
  payment_method: string;
};

export const orderService = {
  createOrder: async (payload: CreateOrderPayload): Promise<{ id: string; total_amount: number }> => {
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create order');
    }
    
    return res.json();
  },

  requestQuote: async (payload: QuoteRequestPayload): Promise<{ orderId: string; requiresQuote: boolean }> => {
    const res = await fetch('/api/orders/request-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to request quote');
    }
    
    return res.json();
  },

  fetchOrders: async (): Promise<Order[]> => {
    const res = await fetch('/api/account/orders');
    if (!res.ok) {
      throw new Error('Failed to fetch orders');
    }
    return res.json();
  },

  fetchOrderDetails: async (orderId: string): Promise<{ order: Order; history: any[] }> => {
    const res = await fetch(`/api/account/orders/${orderId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch order details');
    }
    return res.json();
  },

  cancelOrder: async (orderId: string): Promise<void> => {
    const res = await fetch(`/api/account/orders?id=${orderId}&action=cancel`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to cancel order');
    }
  },

  uploadPaymentProof: async (
    orderId: string,
    proofUrl: string,
    note?: string,
    transactionReference?: string
  ): Promise<void> => {
    const res = await fetch('/api/account/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: orderId,
        proofOfPaymentUrl: proofUrl,
        paymentNote: note || '',
        transactionReference: transactionReference || '',
      }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to upload proof');
    }
  },

  checkServiceability: async (location: string, deliveryMethodId: number): Promise<any> => {
    const res = await fetch('/api/delivery/check-serviceability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, deliveryMethodId }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to check serviceability');
    }
    return res.json();
  },

  validatePromo: async (code: string, cartTotal: number, productIds: string[]): Promise<any> => {
    const res = await fetch('/api/validate-promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal, productIds }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Invalid promo code');
    }
    return res.json();
  },

  fetchPaymentProviders: async (): Promise<{ automatic: any[]; manual: any[] }> => {
    const res = await fetch('/api/payment-providers');
    if (!res.ok) {
      throw new Error('Failed to fetch payment providers');
    }
    return res.json();
  },

  fetchDeliveryMethods: async (): Promise<any[]> => {
    const res = await fetch('/api/delivery-methods');
    if (!res.ok) {
      throw new Error('Failed to fetch delivery methods');
    }
    return res.json();
  },

  fetchDeliveryAreas: async (): Promise<any[]> => {
    const res = await fetch('/api/delivery-areas');
    if (!res.ok) {
      throw new Error('Failed to fetch delivery areas');
    }
    return res.json();
  }
};
