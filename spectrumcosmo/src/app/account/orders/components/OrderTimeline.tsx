// app/account/orders/components/OrderTimeline.tsx
'use client';

import { CheckCircle2, Package, Truck, Clock, Send, AlertCircle } from 'lucide-react';
import { Order } from '@/lib/types/order';
import { STATUS_CONFIG } from '@/lib/order-status';

interface OrderTimelineProps {
  order: Order;
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  // Define timeline steps based on order status
  const getTimelineSteps = () => {
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: Package, completed: true },
      { key: 'payment', label: 'Payment', icon: Clock, completed: false },
      { key: 'processing', label: 'Processing', icon: Package, completed: false },
      { key: 'shipped', label: 'Shipped', icon: Truck, completed: false },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle2, completed: false },
    ];

    // Mark completed based on status
    switch (order.status) {
      case 'pending':
        steps[1].completed = false;
        break;
      case 'pending_quote':
        steps[1].label = 'Delivery Quote';
        steps[1].icon = Send;
        steps[1].completed = false;
        break;
      case 'awaiting_verification':
        steps[1].label = 'Payment Under Review';
        steps[1].icon = AlertCircle;
        steps[1].completed = true;
        break;
      case 'processing':
        steps[1].completed = true;
        steps[2].completed = true;
        break;
      case 'shipped':
        steps[1].completed = true;
        steps[2].completed = true;
        steps[3].completed = true;
        break;
      case 'delivered':
        steps[1].completed = true;
        steps[2].completed = true;
        steps[3].completed = true;
        steps[4].completed = true;
        break;
      default:
        break;
    }

    return steps;
  };

  const steps = getTimelineSteps();

  return (
    <div className="border-t border-[var(--border)] pt-4">
      <p className="font-semibold text-xs sm:text-sm mb-3 text-[var(--foreground)]">Order Progress</p>
      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.key} className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex items-center">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  step.completed ? 'bg-green-500' : 'bg-[var(--border)]'
                }`} />
                {!isLast && (
                  <div className={`absolute top-2 left-0.5 w-0.5 h-4 ${
                    step.completed && steps[idx + 1]?.completed ? 'bg-green-500' : 'bg-[var(--border)]'
                  }`} />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <step.icon size={10} className={step.completed ? 'text-green-500' : 'text-[var(--foreground-muted)]'} />
                <p className={`text-[10px] sm:text-xs ${
                  step.completed ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'
                }`}>
                  {step.label}
                </p>
              </div>
              {step.completed && idx === 0 && (
                <span className="text-[9px] sm:text-xs text-[var(--foreground-muted)] ml-auto">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
