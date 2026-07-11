'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Loader2, Plus, Trash2, Edit2, MapPin, Phone, Mail, 
  Home, Building, CheckCircle, X, AlertCircle, Sparkles,
  ArrowLeft, Globe, Clock, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malawi',
    is_default: false,
  });

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/addresses');
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load addresses:', err);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const openAddModal = () => {
    setEditingAddress(null);
    setForm({
      full_name: '',
      phone_number: '',
      email: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Malawi',
      is_default: addresses.length === 0,
    });
    setShowModal(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setForm({
      full_name: address.full_name,
      phone_number: address.phone_number,
      email: address.email || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || 'Malawi',
      is_default: address.is_default,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      is_default: form.is_default,
    };

    try {
      const url = editingAddress 
        ? `/api/account/addresses?id=${editingAddress.id}`
        : '/api/account/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save address');
      }

      toast.success(editingAddress ? 'Address updated' : 'Address added');
      setShowModal(false);
      loadAddresses();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/account/addresses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Address deleted');
      loadAddresses();
    } catch (err) {
      toast.error('Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const setDefaultAddress = async (id: string) => {
    const address = addresses.find(a => a.id === id);
    if (!address) return;

    try {
      const res = await fetch(`/api/account/addresses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...address, is_default: true }),
      });
      
      if (!res.ok) throw new Error('Failed to set default');
      
      toast.success('Default address updated');
      loadAddresses();
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading your addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      
      {/* Header - With Manga Panel */}
      <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden mb-5 sm:mb-6 md:mb-8">
        <div className="relative z-10 p-4 sm:p-5 md:p-6 bg-[var(--background-card)]/95">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <Link href="/account" className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-full transition">
              <ArrowLeft size={18} className="text-[var(--foreground-muted)] sm:w-5 sm:h-5" />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-5 sm:h-6 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">My Addresses</h1>
              <Sparkles size={14} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-[var(--foreground-muted)] text-xs sm:text-sm mt-1 ml-8 sm:ml-10 md:ml-14">Manage your shipping addresses</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-5 sm:mb-6">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-sm sm:text-base transition shadow-sm"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          Add New Address
        </button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-6 sm:p-8 md:p-12 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5">
            <MapPin size={32} className="text-[var(--foreground-muted)]/50 sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-1 sm:mb-2">No addresses yet</h2>
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base mb-4 sm:mb-5 md:mb-6">Add your first shipping address</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative bg-[var(--background-card)] rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                address.is_default ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5' : 'border-[var(--border)]'
              }`}
            >
              {/* Default Badge */}
              {address.is_default && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Star size={10} className="fill-current sm:w-3 sm:h-3" />
                    Default
                  </span>
                </div>
              )}

              {/* Address Content */}
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="font-bold text-[var(--foreground)] text-sm sm:text-base md:text-lg pr-14 sm:pr-16 md:pr-20">{address.full_name}</h3>
                <div className="space-y-1 text-xs sm:text-sm text-[var(--foreground-muted)]">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <MapPin size={12} className="text-[var(--foreground-muted)]/60 mt-0.5 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                    <div>
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>{address.city}, {address.state || ''} {address.postal_code || ''}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Phone size={12} className="text-[var(--foreground-muted)]/60 sm:w-3.5 sm:h-3.5" />
                    <span>{address.phone_number}</span>
                  </div>
                  {address.email && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Mail size={12} className="text-[var(--foreground-muted)]/60 sm:w-3.5 sm:h-3.5" />
                      <span className="break-all">{address.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[var(--border)]">
                {!address.is_default && (
                  <button
                    onClick={() => setDefaultAddress(address.id)}
                    className="text-[10px] sm:text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-0.5 sm:gap-1 transition"
                  >
                    <Star size={10} className="sm:w-3 sm:h-3" /> Set as default
                  </button>
                )}
                <button
                  onClick={() => openEditModal(address)}
                  className="text-[10px] sm:text-xs text-[var(--foreground-muted)] hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-0.5 sm:gap-1 transition"
                >
                  <Edit2 size={10} className="sm:w-3 sm:h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="text-[10px] sm:text-xs text-[var(--foreground-muted)] hover:text-red-600 dark:hover:text-red-400 font-medium flex items-center gap-0.5 sm:gap-1 transition disabled:opacity-50"
                >
                  {deletingId === address.id ? (
                    <Loader2 size={10} className="animate-spin sm:w-3 sm:h-3" />
                  ) : (
                    <Trash2 size={10} className="sm:w-3 sm:h-3" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-3.5 sm:p-4 md:p-5 border-b border-[var(--border)] flex-shrink-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition">
                <X size={18} className="text-[var(--foreground-muted)] sm:w-5 sm:h-5" />
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div className="overflow-y-auto p-3.5 sm:p-4 md:p-5 flex-1">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                      className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={form.address_line1}
                    onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                    className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={form.address_line2}
                    onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                    className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">State/Province</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                      className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full p-2 sm:p-2.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    >
                      <option value="Malawi">Malawi</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                  />
                  <span className="text-xs sm:text-sm text-[var(--foreground)]">Set as default address</span>
                </label>

                {/* Fixed Footer Buttons */}
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 sticky bottom-0 bg-[var(--background-card)]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl py-2 sm:py-2.5 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                    {submitting ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
