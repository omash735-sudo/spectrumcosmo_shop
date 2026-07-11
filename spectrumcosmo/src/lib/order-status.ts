// lib/order-status.ts
import { 
  Clock, Package, Truck, CheckCircle2, XCircle, AlertCircle, Send
} from 'lucide-react';
import { OrderStatus } from '@/lib/types/order';

export const STATUS_CONFIG: Record<OrderStatus, { 
  label: string; 
  icon: any; 
  color: string; 
  bg: string;
  step: number;
  description: string;
}> = {
  pending: {
    label: 'Pending Payment',
    icon: Clock,
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    step: 1,
    description: 'Order placed, awaiting payment confirmation'
  },
  pending_quote: {
    label: 'Pending Delivery Quote',
    icon: Send,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    step: 1,
    description: 'Delivery quote requested, admin will review'
  },
  awaiting_verification: {
    label: 'Payment Verification',
    icon: AlertCircle,
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    step: 2,
    description: 'Payment proof uploaded, admin verifying'
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    step: 3,
    description: 'Order confirmed and being prepared'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    step: 4,
    description: 'Order on its way to you'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    step: 5,
    description: 'Order has been delivered'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    step: 0,
    description: 'Order has been cancelled'
  }
};

export const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30'
  },
  awaiting_verification: {
    label: 'Awaiting Verification',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30'
  },
  paid: {
    label: 'Paid',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30'
  }
};
