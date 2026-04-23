'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

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
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-600" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-6">

          {/* ADD NEW ADDRESS */}
          <section className="bg-white p-6 rounded-2xl border">
            <h2 className="text-xl font-bold mb-4">Add New Address</h2>

            <form onSubmit={addAddress} className="space-y-3">

              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, first_name: e.target.value }))
                  }
                />

                <input
                  className="input"
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, last_name: e.target.value }))
                  }
                />
              </div>

              <input
                className="input"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />

              <input
                className="input"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />

              <input
                className="input"
                placeholder="Address Line"
                value={form.address_line}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address_line: e.target.value }))
                }
              />

              <input
                className="input"
                placeholder="City / Area"
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
              />

              <button className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </section>

          {/* SAVED ADDRESSES */}
          <section className="bg-white p-6 rounded-2xl border">
            <h2 className="text-xl font-bold mb-4">Saved Addresses</h2>

            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No addresses saved yet.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="border rounded-lg p-3 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {a.first_name} {a.last_name}
                      </p>
                      <p className="text-xs text-gray-600">{a.phone}</p>
                      <p className="text-xs text-gray-600">{a.email}</p>
                      <p className="text-xs text-gray-600">
                        {a.address_line}, {a.city}
                      </p>

                      {a.is_default && (
                        <span className="text-xs text-green-600 font-medium">
                          Default Address
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deleteAddress(a.id)}
                      className="text-xs text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
