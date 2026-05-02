'use client'

import { useEffect, useState } from 'react'
import AccountLayout from '@/components/account/AccountLayout'
import { Loader2, MapPin, Trash2 } from 'lucide-react'

type Address = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  address_line: string
  city: string
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
    city: '',
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
      city: '',
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

      <h1 className="text-2xl font-bold text-[#111] mb-2">
        Addresses
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Manage delivery locations for your orders
      </p>

      <div className="grid md:grid-cols-2 gap-6">

        {/* ADD NEW ADDRESS */}
        <section className="bg-white p-6 rounded-xl border">

          <h2 className="text-lg font-bold mb-4">
            Add New Address
          </h2>

          <form onSubmit={addAddress} className="space-y-3">

            <div className="grid grid-cols-2 gap-2">
              <input
                className="border rounded-lg p-2 text-sm"
                placeholder="First Name"
                value={form.first_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, first_name: e.target.value }))
                }
              />

              <input
                className="border rounded-lg p-2 text-sm"
                placeholder="Last Name"
                value={form.last_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, last_name: e.target.value }))
                }
              />
            </div>

            <input
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />

            <input
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />

            <input
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="Address Line"
              value={form.address_line}
              onChange={(e) =>
                setForm((p) => ({ ...p, address_line: e.target.value }))
              }
            />

            <input
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="City"
              value={form.city}
              onChange={(e) =>
                setForm((p) => ({ ...p, city: e.target.value }))
              }
            />

            <button
              disabled={saving}
              className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>

          </form>

        </section>

        {/* SAVED ADDRESSES */}
        <section className="bg-white p-6 rounded-xl border">

          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} />
            Saved Addresses
          </h2>

          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No addresses saved yet.
            </p>
          ) : (
            <div className="space-y-3">

              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="border rounded-lg p-4 relative"
                >

                  {/* DEFAULT TAG */}
                  {a.is_default && (
                    <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      Default
                    </span>
                  )}

                  <p className="font-medium text-sm text-[#111]">
                    {a.first_name} {a.last_name}
                  </p>

                  <p className="text-xs text-gray-600">{a.phone}</p>
                  <p className="text-xs text-gray-600">{a.email}</p>

                  <p className="text-xs text-gray-600 mt-1">
                    {a.address_line}, {a.city}
                  </p>

                  {/* ACTIONS */}
                  <button
                    onClick={() => deleteAddress(a.id)}
                    className="mt-3 text-xs text-red-500 flex items-center gap-1 hover:underline"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>

    </AccountLayout>
  )
}
