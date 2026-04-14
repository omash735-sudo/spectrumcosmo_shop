export const dynamic = 'force-dynamic'

import { getDb } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'

export default async function NewsletterPreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  const [newsletter] = await sql`
    SELECT * FROM newsletter WHERE id = ${params.id}
  `

  if (!newsletter) {
    return (
      <div className="p-6 text-gray-500">
        Newsletter not found
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">

      <h1 className="text-2xl font-bold text-[#111111] mb-2">
        {newsletter.title}
      </h1>

      <p className="text-sm text-gray-400 mb-4">
        Audience: {newsletter.audience} | Status: {newsletter.status}
      </p>

      {newsletter.image_url && (
        <img
          src={newsletter.image_url}
          className="w-full rounded-xl mb-4"
        />
      )}

      <div className="text-gray-700 whitespace-pre-wrap mb-6">
        {newsletter.content}
      </div>

      <div className="flex gap-3">

        <button
          onClick={async () => {
            await fetch('/api/newsletter/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: newsletter.id }),
            })

            window.location.reload()
          }}
          className="bg-[#F97316] text-white px-4 py-2 rounded"
        >
          Send Now
        </button>

        <a
          href="/admin/newsletter"
          className="bg-gray-200 text-black px-4 py-2 rounded"
        >
          Back
        </a>

      </div>

    </div>
  )
}
