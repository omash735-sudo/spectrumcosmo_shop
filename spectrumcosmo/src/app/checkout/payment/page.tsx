import { Suspense } from 'react'
import PaymentContent from './PaymentContent'

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading payment details...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
