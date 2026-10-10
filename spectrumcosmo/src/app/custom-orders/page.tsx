'use client';

// app/custom-orders/page.tsx
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle, Send } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const ITEM_TYPES = ['T-Shirt', 'Hoodie', 'Anime Jersey', 'Accessory', 'Other'];

const field =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]';

export default function CustomOrdersPage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [itemType, setItemType] = useState(ITEM_TYPES[0]);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState(''); // honeypot, hidden from people
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/custom-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          item_type: itemType,
          quantity,
          description,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="mx-auto text-[var(--primary)]" size={48} />
        <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Request received</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Thank you, {name.split(' ')[0]}. We will contact you on {contact} to talk about your design and
          the price.
        </p>
        <Link
          href="/products"
          className="inline-flex mt-6 items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] min-h-[44px]"
        >
          Keep shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Custom orders</h1>
      <p className="mt-2 text-sm md:text-base text-[var(--foreground-muted)]">
        Tell us what you would like made. We will contact you to confirm the design, quantity and price
        before anything is printed.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="co-name" className="block text-sm font-medium text-[var(--foreground)] mb-1">Your name</label>
          <input id="co-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>

        <div>
          <label htmlFor="co-contact" className="block text-sm font-medium text-[var(--foreground)] mb-1">Phone or email</label>
          <input id="co-contact" className={field} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="tel" placeholder="e.g. 0999 123 456" required />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label htmlFor="co-type" className="block text-sm font-medium text-[var(--foreground)] mb-1">Item</label>
            <select id="co-type" className={field} value={itemType} onChange={(e) => setItemType(e.target.value)}>
              {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="co-qty" className="block text-sm font-medium text-[var(--foreground)] mb-1">Qty</label>
            <input id="co-qty" type="number" inputMode="numeric" min={1} max={1000} className={field} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} />
          </div>
        </div>

        <div>
          <label htmlFor="co-desc" className="block text-sm font-medium text-[var(--foreground)] mb-1">What should we make?</label>
          <textarea id="co-desc" rows={5} maxLength={2000} className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the design, colours, sizes, anime or artwork you have in mind." required />
        </div>

        {/* Honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60 min-h-[48px]"
        >
          <Send size={16} />
          {submitting ? 'Sending…' : 'Send request'}
        </button>
      </form>
    </div>
  );
}
