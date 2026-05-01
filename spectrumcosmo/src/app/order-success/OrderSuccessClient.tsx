'use client'

import { Suspense, useEffect, useState } from 'react'
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

function OrderSuccessContent() {
  const searchParams = useSearchParams()

  const tx_ref = searchParams.get('tx_ref')
  const status = searchParams.get('status')

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // If PayChangu already failed, skip verification
        if (!tx_ref || status === 'failed') {
          setResult({ verified: false })
          setLoading(false)
          return
        }

        const res = await fetch(
          `/api/paychangu/verify?tx_ref=${tx_ref}`
        )

        const data: VerifyResult = await res.json()

        setResult(data)
      } catch (error) {
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

        <div className="bg-white w-full max-w-md p-8 rounded-2xl border text-center space-y-5">

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
              <div className="text-green-600 text-5xl">✔</div>

              <h1 className="text-xl font-bold">
                Payment Successful
              </h1>

              <p className="text-sm text-gray-600">
                Your order has been confirmed and is now being processed.
              </p>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Transaction Ref: {tx_ref}</p>
                {result.amount && (
                  <p>
                    Amount: {result.currency} {result.amount}
                  </p>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <a
                  href="/payments"
                  className="block bg-orange-500 text-white py-2 rounded-lg text-sm"
                >
                  View My Orders
                </a>

                <a
                  href="/"
                  className="block text-sm text-gray-600 hover:underline"
                >
                  Back to Home
                </a>
              </div>
            </>
          )}

          {/* FAILED */}
          {!loading && !result?.verified && (
            <>
              <div className="text-red-600 text-5xl">✖</div>

              <h1 className="text-xl font-bold">
                Payment Not Verified
              </h1>

              <p className="text-sm text-gray-600">
                We couldn’t confirm your payment. If money was deducted,
                contact support with your reference.
              </p>

              <div className="text-xs text-gray-500">
                TX Ref: {tx_ref || 'N/A'}
              </div>

              <div className="pt-4 space-y-2">
                <a
                  href="/checkout"
                  className="block bg-gray-900 text-white py-2 rounded-lg text-sm"
                >
                  Try Again
                </a>

                <a
                  href="/"
                  className="block text-sm text-gray-600 hover:underline"
                >
                  Back to Home
                </a>
              </div>
            </>
          )}

        </div>

      </main>

      <Footer />
    </>
  )
}

export default function OrderSuccessClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  )
}
