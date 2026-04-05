import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-8xl font-bold text-[#F97316] mb-4">404</p>
        <h1 className="text-3xl font-bold text-[#111111] mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8">This page does not exist.</p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  )
}
