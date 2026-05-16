'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Trash2, Plus, CheckCircle, Edit2 } from 'lucide-react';

type Address = {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  zip?: string;
  country: string;
  is_default?: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const resetForm = () => {
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
      is_default: false,
    });
    setEditingId(null);
  };

  const handleEdit = (address: Address) => {
    setForm({
      full_name: address.full_name || `${address.first_name || ''} ${address.last_name || ''}`.trim(),
      phone_number: address.phone_number,
      email: address.email || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code || address.zip || '',
      country: address.country || 'Malawi',
      is_default: address.is_default || false,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId ? '/api/account/addresses' : '/api/account/addresses';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        setShowForm(false);
        loadAddresses();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save address');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await fetch(`/api/account/addresses?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadAddresses();
      } else {
        alert('Failed to delete address');
      }
    } catch (err) {
      alert('Something went wrong');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage delivery locations for your orders</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            <Plus size={18} />
            Add Address
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ADD/EDIT ADDRESS FORM */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-orange-500" />
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>

            <form onSubmit={addAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  required
                />
              </div>

              <input
                type="email"
                placeholder="Email (optional)"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <input
                type="text"
                placeholder="Address Line 1"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                required
              />

              <input
                type="text"
                placeholder="Address Line 2 (optional)"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.address_line2}
                onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="State / Province"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Postal Code"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Country"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SAVED ADDRESSES */}
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 ${!showForm ? 'md:col-span-2' : ''}`}>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            Saved Addresses ({addresses.length})
          </h2>

          {addresses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No addresses saved yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-gray-100 rounded-lg p-4 relative bg-gray-50/30 hover:shadow-sm transition">
                  {addr.is_default && (
                    <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} />
                      Default
                    </span>
                  )}
                  <p className="font-medium text-gray-800">
                    {addr.full_name || `${addr.first_name || ''} ${addr.last_name || ''}`.trim()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.phone_number}</p>
                  {addr.email && <p className="text-xs text-gray-500">{addr.email}</p>}
                  <p className="text-xs text-gray-600 mt-2">
                    {addr.address_line1}
                    {addr.address_line2 && `, ${addr.address_line2}`}
                    <br />
                    {addr.city}
                    {addr.state && `, ${addr.state}`}
                    {addr.postal_code && ` ${addr.postal_code}`}
                    {addr.zip && ` ${addr.zip}`}
                    <br />
                    {addr.country}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="text-xs text-gray-500 flex items-center gap-1 hover:text-orange-500 transition"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-xs text-red-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
