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

  // Prevent body scroll when modal is open
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
          <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/account" className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Addresses</h1>
            <Sparkles size={18} className="text-orange-400" />
          </div>
        </div>
        <p className="text-gray-500 text-sm ml-14">Manage your shipping addresses</p>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition shadow-sm"
        >
          <Plus size={18} />
          Add New Address
        </button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <MapPin size={48} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No addresses yet</h2>
          <p className="text-gray-500 mb-6">Add your first shipping address</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition"
          >
            <Plus size={18} />
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                address.is_default ? 'border-orange-300 bg-orange-50/30' : 'border-gray-100'
              }`}
            >
              {/* Default Badge */}
              {address.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    <Star size={12} fill="currentColor" />
                    Default
                  </span>
                </div>
              )}

              {/* Address Content */}
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-lg">{address.full_name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>{address.city}, {address.state || ''} {address.postal_code || ''}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{address.phone_number}</span>
                  </div>
                  {address.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span>{address.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                {!address.is_default && (
                  <button
                    onClick={() => setDefaultAddress(address.id)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    <Star size={12} /> Set as default
                  </button>
                )}
                <button
                  onClick={() => openEditModal(address)}
                  className="text-xs text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {deletingId === address.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Modal - Fixed Scrolling */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div className="overflow-y-auto p-5 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={form.address_line1}
                    onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={form.address_line2}
                    onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Malawi">Malawi</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Set as default address</span>
                </label>

                {/* Fixed Footer Buttons - Inside scrollable area but at bottom */}
                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-2.5 font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
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
