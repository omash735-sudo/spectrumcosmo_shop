'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle, 
  Send, Eye, CreditCard, Calendar, ChevronRight,
  Loader2, Upload, X, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from '@/lib/types/order';
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/order-status';
import { orderService } from '@/lib/services/orderService';
import PaymentProofUpload from './PaymentProofUpload';
import OrderTimeline from './OrderTimeline';

interface OrderCardProps {
  order: Order;
  onRefresh: () => void;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload';

export default function OrderCard({ order, onRefresh }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;

  const canUploadProof = order.status === 'pending';
  const hasProof = !!order.proof_of_payment_url;
  const orderDisplayNumber = order.order_number || `#${order.id.slice(-8)}`;

  const deliveryMethod = order.custom_delivery_method || 'Not specified';
  
  // Safely format total amount
  const totalAmount = order.total_amount ?? 0;
  const formattedTotal = totalAmount.toLocaleString();

  const handleUploadProof = async (file: File, note: string, transactionRef: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error('Upload failed');

      await orderService.uploadPaymentProof(
        order.id,
        uploadData.secure_url,
        note,
        transactionRef
      );

      toast.success('Payment proof submitted! Admin will review shortly.');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      
      {/* Header */}
      <div className="p-3.5 sm:p-4 md:p-5 border-b border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Package size={14} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-mono font-medium text-[var(--foreground)]">{orderDisplayNumber}</p>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5">
                <Calendar size={10} className="sm:w-3 sm:h-3" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon size={10} className="sm:w-3 sm:h-3" />
              {statusConfig.label}
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition p-0.5 sm:p-1"
            >
              <ChevronRight size={14} className={`sm:w-[18px] sm:h-[18px] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Body - Always visible summary */}
      <div className="p-3.5 sm:p-4 md:p-5">
        <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
              {order.items && order.items.length > 0 ? order.items[0].product_name : 'Order'}
              {order.items && order.items.length > 1 && ` +${order.items.length - 1} more`}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1">
                <CreditCard size={10} className="sm:w-3 sm:h-3" />
                {order.payment_method || 'Manual'}
              </span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${paymentConfig.bg} ${paymentConfig.color}`}>
                {paymentConfig.label}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[var(--foreground-muted)]">Total</p>
            <p className="text-base sm:text-lg font-bold text-[var(--primary)]">
              MWK {formattedTotal}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] p-3.5 sm:p-4 md:p-5 space-y-4 bg-[var(--background)]/50">
          
          {/* Items List */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-[var(--foreground)]">Items</p>
              {order.items.map((item, idx) => {
                const itemTotal = item.total_price ?? 0;
                return (
                  <div key={idx} className="flex items-center gap-3 text-sm py-1 border-b border-[var(--border)] last:border-0">
                    <div className="w-10 h-10 bg-[var(--background-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url && (
                        <Image src={item.image_url} alt={item.product_name} width={40} height={40} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--foreground)]">{item.product_name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      MWK {itemTotal.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delivery Info */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[var(--foreground-muted)] font-medium">Delivery Address</p>
              <p className="text-[var(--foreground)]">{order.delivery_address || 'N/A'}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Courier: {deliveryMethod}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-muted)] font-medium">Payment Details</p>
              <p className="text-[var(--foreground)]">Method: {order.payment_method || 'Manual'}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Status: {paymentConfig.label}</p>
            </div>
          </div>

          {/* Payment Proof Upload */}
          {canUploadProof && !hasProof && (
            <PaymentProofUpload 
              orderId={order.id}
              onUpload={handleUploadProof}
              uploading={uploading}
            />
          )}

          {/* Existing Proof */}
          {hasProof && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3.5 sm:p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                <p className="font-medium text-green-800 dark:text-green-400 text-sm sm:text-base">Payment Proof Submitted</p>
              </div>
              <button
                onClick={() => window.open(order.proof_of_payment_url!, '_blank')}
                className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs sm:text-sm underline flex items-center gap-1 transition"
              >
                <Eye size={12} /> View uploaded proof
              </button>
              {order.payment_note && <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 mt-2">Note: {order.payment_note}</p>}
            </div>
          )}

          {/* Order Timeline */}
          <OrderTimeline order={order} />

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={`/account/orders/${order.id}`}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-1"
            >
              <Eye size={14} /> View Details
            </Link>
            {order.status === 'pending' && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to cancel this order?')) {
                    try {
                      await orderService.cancelOrder(order.id);
                      toast.success('Order cancelled');
                      onRefresh();
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }
                }}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
