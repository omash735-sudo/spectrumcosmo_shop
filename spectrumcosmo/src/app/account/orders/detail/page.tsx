'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Truck, Package, Clock, CheckCircle2, XCircle, 
  AlertCircle, Download, Eye, MapPin, Phone, Calendar, 
  DollarSign, CreditCard, ShoppingBag, Heart, Shield,
  ChevronRight, ArrowLeft, Printer, MessageCircle, Star,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
  tracking_number: string | null;
  tracking_notes: string | null;
  admin_notes: string | null;
  delivered_at: string | null;
  promo_code: string | null;
  referral_code: string | null;
  custom_delivery_method: string | null;
  delivery_fee: number | null;
  currency: string | null;
  items: Array<{ 
    product_name: string; 
    quantity: number; 
    unit_price: number; 
    total_price: number;
    image_url?: string;
  }>;
}

interface StatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  changed_at: string;
  status_name: string;
  color: string;
}

const formatAmount = (amount: number, currency: string) => {
  return `${currency} ${amount?.toLocaleString() || '0'}`;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; step: number }> = {
  pending: { label: 'Order Placed', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Clock, step: 1 },
  processing: { label: 'Processing', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: Package, step: 2 },
  shipped: { label: 'Shipped', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: Truck, step: 3 },
  delivered: { label: 'Delivered', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle2, step: 4 },
  cancelled: { label: 'Cancelled', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', icon: XCircle, step: 0 },
};

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.replace('/account/orders');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (!res.ok) throw new Error('Failed to load order');
        const data = await res.json();
        setOrder(data.order);
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, router]);

  // ... rest of the component stays exactly the same ...

  // (Keep all the JSX and logic identical, just update the useEffect above)

  if (loading) { /* ... */ }
  if (!order) { /* ... */ }
  // ... rest of return statement unchanged
}
