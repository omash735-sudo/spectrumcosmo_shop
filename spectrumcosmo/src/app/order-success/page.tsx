'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

type VerifyResult = {
  verified: boolean
  amount?: number
  currency?: string
  charge_id?: string
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()

  const tx_ref = searchParams.get('tx_ref')
  const status = searchParams.get('status')

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // If PayChangu already says failed, skip verification
        if (!tx_ref || status === 'failed') {
          setResult({ verified: false })
          setLoading(false)
          return
        }

        const res = await fetch(
          `/api/paychangu/verify?tx_ref=${tx_ref}`
        )

        const data = await res.json()

        setResult(data)
      } catch (err) {
        setResult({ verified: false })
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [tx_ref, status])

  return (
    <>
      <Navbar />

      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

        <div className="bg-white p-8 rounded-2xl border w-full max-w-md text-center space-y-4">

          {/* LOADING */}
          {loading && (
            <>
              <Loader2 className="animate-spin mx-auto text-orange-500" />
              <p className="text-sm text-gray-600">
                Verifying your payment...
              </p>
            </>
          )}

          {/* SUCCESS */}
          {!loading && result?.verified && (
            <>
              <div className="text-green-600 text-3xl">✔</div>

              <h1 className="text-xl font-bold">
                Payment Successful
              </h1>

              <p className="text-sm text-gray-600">
                Your order has been confirmed and is being processed.
              </p>

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  Amount: MWK{' '}
                  {result.amount?.toLocaleString()}
                </p>
                <p>Reference: {tx_ref}</p>
              </div>

              <a
                href="/orders"
                className="inline-block mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
              >
                View Orders
              </a>
            </>
          )}

          {/* FAILED */}
          {!loading && !result?.verified && (
            <>
              <div className="text-red-600 text-3xl">✖</div>

              <h1 className="text-xl font-bold">
                Payment Not Confirmed
              </h1>

              <p className="text-sm text-gray-600">
                We could not verify your payment. If money was deducted,
                contact support with your reference.
              </p>

              <div className="text-xs text-gray-500">
                TX Ref: {tx_ref || 'N/A'}
              </div>

              <a
                href="/checkout"
                className="inline-block mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm"
              >
                Try Again
              </a>
            </>
          )}

        </div>

      </main>

      <Footer />
    </>
  )
}
