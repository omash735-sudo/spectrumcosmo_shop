'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

type CheckoutData = {
  items: any[]
  form: {
    customer_name: string
    phone_number: string
    custom_details: string
  }
  subtotalUsd: number
}

const BANKS = {
  national: {
    name: 'National Bank of Malawi',
    accountName: 'Omash Mashiri',
    accountNumber: '1011435331'
  },
  standard: {
    name: 'Standard Bank',
    accountName: 'Omash Mashiri',
    accountNumber: '9100007328742'
  },
  fcb: {
    name: 'First Capital Bank',
    accountName: 'Omash Mashiri',
    accountNumber: '0004503146447'
  }
}

export default function PaymentPage() {
  const [data, setData] = useState<CheckoutData | null>(null)
  const [method, setMethod] = useState<'mobile' | 'bank' | 'card' | ''>('')
  const [wallet, setWallet] = useState<'airtel' | 'mpamba' | ''>('')
  const [bank, setBank] = useState<'national' | 'standard' | 'fcb' | ''>('')
  const [reference, setReference] = useState('')
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('checkoutData')
    if (!saved) {
      window.location.href = '/checkout'
      return
    }
    setData(JSON.parse(saved))
  }, [])

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  const submitOrder = async () => {
    if (!method) return
    if (method === 'mobile' && !wallet) return
    if (method === 'bank' && !bank) return

    setPlacing(true)

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data.form,
        items: data.items,
        total_price_usd: data.subtotalUsd,
        payment_method: method === 'mobile' ? wallet : method,
        payment_reference: reference
      })
    })

    localStorage.removeItem('checkoutData')
    setPlacing(false)
    setMessage('Order placed successfully. Track it in your account.')
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 space-y-6">

          <h1 className="text-2xl font-bold">Payment</h1>

          {/* PAYMENT METHOD CARDS */}
          <div className="grid md:grid-cols-3 gap-4">

            <button
              onClick={() => setMethod('mobile')}
              className={`p-4 rounded-xl border hover:shadow ${
                method === 'mobile' ? 'border-orange-500' : ''
              }`}
            >
              Mobile Wallet
            </button>

            <button
              onClick={() => setMethod('bank')}
              className={`p-4 rounded-xl border hover:shadow ${
                method === 'bank' ? 'border-orange-500' : ''
              }`}
            >
              Bank Transfer
            </button>

            <button
              onClick={() => setMethod('card')}
              className={`p-4 rounded-xl border opacity-60 cursor-not-allowed`}
              disabled
            >
              Card / E-Payment (Coming Soon)
            </button>
          </div>

          {/* MOBILE MONEY */}
          {method === 'mobile' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <button onClick={() => setWallet('airtel')} className="btn-secondary">
                  Airtel Money
                </button>
                <button onClick={() => setWallet('mpamba')} className="btn-secondary">
                  TNM Mpamba
                </button>
              </div>

              {wallet && (
                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="font-semibold">
                    {wallet === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'}
                  </p>

                  <p className="text-sm mt-2">
                    Send to:
                    <b className="ml-1">
                      {wallet === 'airtel' ? '0888 123 456' : '0999 987 654'}
                    </b>
                  </p>

                  <p className="text-sm">Name: SpectrumCosmo</p>

                  <input
                    className="input mt-3"
                    placeholder="Transaction Reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* BANK TRANSFER */}
          {method === 'bank' && (
            <div className="space-y-4">

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setBank('national')} className="btn-secondary">
                  National Bank
                </button>
                <button onClick={() => setBank('standard')} className="btn-secondary">
                  Standard Bank
                </button>
                <button onClick={() => setBank('fcb')} className="btn-secondary">
                  First Capital
                </button>
              </div>

              {bank && (
                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="font-semibold">{BANKS[bank].name}</p>

                  <p className="text-sm mt-2">
                    Account Name: <b>{BANKS[bank].accountName}</b>
                  </p>

                  <p className="text-sm">
                    Account Number: <b>{BANKS[bank].accountNumber}</b>
                  </p>

                  <input
                    className="input mt-3"
                    placeholder="Transaction Reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* SUBMIT */}
          <button
            onClick={submitOrder}
            disabled={placing}
            className="btn-primary w-full justify-center"
          >
            {placing ? <><Loader2 size={16} className="animate-spin" />Processing...</> : 'Confirm Payment'}
          </button>

          {message && (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-xl">
              {message}
            </p>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
