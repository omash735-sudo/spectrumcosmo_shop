'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartProvider';

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();

  // Hardcoded delivery methods for testing
  const deliveryMethods = [
    { id: 1, name: 'Standard Delivery', price: 1500 },
    { id: 2, name: 'Express Delivery', price: 2500 },
  ];
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '0999123456',
    location: 'Lilongwe',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = 1000 + (deliveryMethods.find(m => m.id === selectedDeliveryId)?.price || 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedDeliveryId) {
      setError('Please select a delivery method');
      return;
    }
    setLoading(true);
    // Simulate order creation
    setTimeout(() => {
      clearCart();
      router.push('/');
    }, 1000);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-2xl border mb-6">
            <h1 className="text-2xl font-bold">Test Checkout</h1>
            <p className="text-sm text-gray-500">Select delivery method to test radio buttons</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleCheckout} className="bg-white p-6 rounded-2xl border space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
                className="w-full border rounded-xl px-3 py-2"
              />

              {/* Delivery Methods - simple test */}
              <div>
                <p className="text-sm font-semibold mb-2">Delivery Method (Test)</p>
                <div className="space-y-2">
                  {deliveryMethods.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="delivery_test"
                        checked={selectedDeliveryId === m.id}
                        onChange={() => {
                          console.log('Selected delivery ID:', m.id);
                          setSelectedDeliveryId(m.id);
                        }}
                      />
                      <span>{m.name} – {m.price} MWK</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Currently selected: {selectedDeliveryId || 'none'}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
              {error && <div className="text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            </form>

            <div className="bg-white p-6 rounded-2xl border h-fit">
              <h2 className="font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items</span> <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span> <span>{deliveryMethods.find(m => m.id === selectedDeliveryId)?.price || 0} MWK</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span> <span>{total} MWK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
