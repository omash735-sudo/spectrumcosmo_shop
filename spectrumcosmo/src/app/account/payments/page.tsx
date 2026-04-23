'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

type Payment = {
  id: string
  order_id: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'failed'
  method: string
  created_at: string
  reference?: string
  proof_url?: string
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function AccountPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Payment | null>(null)

  const load = async () => {
    setLoading(true)

    const res = await fetch('/api/account/payments')
    if (res.ok) {
      setPayments(await res.json())
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

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
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">

          {/* LEFT: PAYMENT LIST */}
          <section className="bg-white rounded-2xl border p-4 md:col-span-1">
            <h2 className="font-bold mb-4">Payment History</h2>

            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`w-full text-left p-3 rounded-lg border hover:bg-gray-50 ${
                      selected?.id === p.id ? 'border-orange-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium">
                      Order: {p.order_id}
                    </p>

                    <p className="text-xs text-gray-500">
                      {p.currency} {p.amount.toFixed(2)}
                    </p>

                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        STATUS_STYLE[p.status]
                      }`}
                    >
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: DETAILS / TRACK STATUS */}
          <section className="bg-white rounded-2xl border p-6 md:col-span-2">
            {!selected ? (
              <p className="text-sm text-gray-500">
                Select a payment to view status tracking.
              </p>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2">
                  Payment Tracking
                </h2>

                <p className="text-sm text-gray-500 mb-6">
                  Order ID: {selected.order_id}
                </p>

                {/* STATUS TRACKING */}
                <div className="space-y-4">

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selected.status !== 'failed'
                          ? 'bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">Payment Submitted</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selected.status === 'approved'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">Payment Approved</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selected.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm">Payment Failed / Rejected</p>
                  </div>
                </div>

                {/* EXTRA INFO */}
                <div className="mt-6 text-sm text-gray-600 space-y-2">
                  <p>
                    Method: <b>{selected.method}</b>
                  </p>

                  <p>
                    Amount: <b>{selected.currency} {selected.amount}</b>
                  </p>

                  <p>
                    Date: {new Date(selected.created_at).toLocaleString()}
                  </p>

                  {selected.reference && (
                    <p>
                      Reference: {selected.reference}
                    </p>
                  )}

                  {selected.proof_url && (
                    <a
                      href={selected.proof_url}
                      target="_blank"
                      className="text-orange-600 hover:underline"
                    >
                      View Payment Proof
                    </a>
                  )}
                </div>
              </>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
