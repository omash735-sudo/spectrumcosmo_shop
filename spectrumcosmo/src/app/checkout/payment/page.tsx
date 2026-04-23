'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/account/orders')
    const data = res.ok ? await res.json() : []
    setPayments(data)
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
          <Loader2 className="animate-spin text-orange-500" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4 space-y-6">

          <h1 className="text-2xl font-bold">Payments & Tracking</h1>

          {payments.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-gray-500">
              No payments found.
            </div>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border p-5 space-y-4">

                {/* HEADER */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{p.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs ${STATUS_STYLE[p.status]}`}>
                    {p.status}
                  </span>
                </div>

                {/* DETAILS */}
                <p className="text-sm text-gray-600">
                  {p.custom_details || 'No extra details'}
                </p>

                {/* PROOF */}
                {p.proof_of_payment_url ? (
                  <a
                    href={p.proof_of_payment_url}
                    target="_blank"
                    className="text-orange-600 text-sm hover:underline"
                  >
                    View Payment Proof
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">
                    No proof uploaded yet
                  </p>
                )}

                {/* PAYMENT METHOD */}
                <p className="text-xs text-gray-500">
                  Method: {p.payment_method || 'Not specified'}
                </p>

                {/* TRACKING TIMELINE */}
                <div className="mt-4 space-y-2 border-t pt-4">

                  <p className="font-semibold text-sm">Tracking</p>

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <p className="text-xs">Order placed</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        p.proof_of_payment_url ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-xs">Proof submitted</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        p.status === 'approved'
                          ? 'bg-green-500'
                          : p.status === 'declined'
                          ? 'bg-red-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-xs">
                      {p.status === 'approved'
                        ? 'Payment approved'
                        : p.status === 'declined'
                        ? 'Payment rejected'
                        : 'Waiting for admin approval'}
                    </p>
                  </div>

                </div>

              </div>
            ))
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
