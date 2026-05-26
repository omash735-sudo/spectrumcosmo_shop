'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfirmDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/account/orders/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      toast.error('Failed to load order');
      router.push('/account/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (response: 'received' | 'not_received') => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      
      if (response === 'received') {
        router.push('/products');
      } else {
        router.push('/account/orders');
      }
    } catch (err: any) {
      toast.error(err.message);
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Package size={48} className="mx-auto text-orange-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Delivery</h1>
        <p className="text-gray-600 mb-2">
          Order #{order.order_number?.slice(-8) || order.id.slice(-8)}
        </p>
        <p className="text-gray-500 mb-8">
          Did you receive your order? Let us know to complete the process.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => handleConfirm('received')}
            disabled={confirming}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Yes, Received
          </button>
          <button
            onClick={() => handleConfirm('not_received')}
            disabled={confirming}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
            Not Received
          </button>
        </div>
        
        <Link href="/account/orders" className="inline-block mt-6 text-gray-500 text-sm hover:text-gray-700">
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
}
