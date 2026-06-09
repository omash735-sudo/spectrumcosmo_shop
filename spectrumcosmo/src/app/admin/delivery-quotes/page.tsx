'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Send, Eye, Clock, MapPin, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuoteRequest {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_location: string;
  requested_method: string;
  admin_quote_fee: number | null;
  admin_quote_notes: string | null;
  status: string;
  total_amount: number;
  order_created_at: string;
  created_at: string;
}

export default function AdminDeliveryQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quote-requests?status=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      toast.error('Failed to load quote requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const handleRespond = async (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setDeliveryFee(quote.admin_quote_fee?.toString() || '');
    setNotes(quote.admin_quote_notes || '');
    setShowModal(true);
  };

  const submitResponse = async (approved: boolean) => {
    if (approved && (!deliveryFee || parseFloat(deliveryFee) <= 0)) {
      toast.error('Please enter a valid delivery fee');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/quote-requests/${selectedQuote?.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryFee: approved ? parseFloat(deliveryFee) : 0,
          notes: notes,
          approved,
        }),
      });

      if (!res.ok) throw new Error('Failed to send response');

      toast.success(approved ? 'Quote sent to customer' : 'Quote request rejected');
      setShowModal(false);
      fetchQuotes();
    } catch (err) {
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"><Clock size={12} /> Pending</span>;
      case 'quoted':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"><Send size={12} /> Quoted</span>;
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"><CheckCircle size={12} /> Paid</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Quote Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and respond to customer quote requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {['pending', 'quoted', 'paid', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium transition ${
              filter === tab
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1 text-xs">
              ({quotes.filter(q => q.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No quote requests found
          </div>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Order #{quote.order_id.slice(-8)}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User size={14} /> {quote.customer_name}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail size={14} /> {quote.customer_email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone size={14} /> {quote.customer_phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin size={14} /> {quote.delivery_location}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Products Total: MWK {quote.total_amount.toLocaleString()}</span>
                    <span>Requested: {quote.requested_method || 'Not specified'}</span>
                    <span>Requested: {new Date(quote.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRespond(quote)}
                  disabled={quote.status !== 'pending'}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {quote.status === 'pending' ? 'Review & Quote' : 'View Details'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quote Response Modal */}
      {showModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Respond to Quote Request
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Order #{selectedQuote.order_id.slice(-8)}
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">Customer Details</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">Name:</span> {selectedQuote.customer_name}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedQuote.customer_email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedQuote.customer_phone}</p>
                  <p><span className="text-gray-500">Location:</span> {selectedQuote.delivery_location}</p>
                  <p><span className="text-gray-500">Requested Method:</span> {selectedQuote.requested_method || 'Standard'}</p>
                  <p><span className="text-gray-500">Products Total:</span> MWK {selectedQuote.total_amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Quote Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Fee (MWK) *
                </label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="Enter delivery fee"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes to Customer (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 resize-none"
                  placeholder="Add any special instructions or explanation for the delivery fee..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => submitResponse(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => submitResponse(true)}
                  disabled={submitting || !deliveryFee}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Send Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
