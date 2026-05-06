'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin, Trash2, Plus } from 'lucide-react'

type Address = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  address_line: string
  address_line2?: string
  city: string
  state: string
  zip: string
  is_default?: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address_line: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
  })

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/account/addresses')
    if (res.ok) {
      setAddresses(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address_line: '',
      address_line2: '',
      city: '',
      state: '',
      zip: '',
    })

    await load()
    setSaving(false)
  }

  const deleteAddress = async (id: string) => {
    await fetch(`/api/account/addresses?id=${id}`, {
      method: 'DELETE',
    })
    await load()
  }

  if (loading) {
    return (
      <AccountLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" />
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Addresses</h1>
        <p className="text-sm text-gray-500 mb-6">Manage delivery locations for your orders</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ADD NEW ADDRESS FORM */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-orange-500" />
              Add New Address
            </h2>

            <form onSubmit={addAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First Name"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>

              <input
                type="tel"
                placeholder="Phone"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />

              <input
                type="email"
                placeholder="Email"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />

              <input
                type="text"
                placeholder="Address Line 1"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
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
                  placeholder="State"
                  className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                />
              </div>

              <input
                type="text"
                placeholder="ZIP / Postal Code"
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                required
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </div>

          {/* SAVED ADDRESSES */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" />
              Saved Addresses
            </h2>

            {addresses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No addresses saved yet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border border-gray-100 rounded-lg p-4 relative bg-gray-50/30 hover:shadow-sm transition">
                    {addr.is_default && (
                      <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    <p className="font-medium text-gray-800">
                      {addr.first_name} {addr.last_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                    <p className="text-xs text-gray-500">{addr.email}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {addr.address_line}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                      <br />
                      {addr.city}, {addr.state} {addr.zip}
                    </p>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="mt-3 text-xs text-red-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
