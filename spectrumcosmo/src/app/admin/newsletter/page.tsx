export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function createNewsletter(formData: FormData) {
  'use server'

  const sql = getDb()

  const title = formData.get('title')?.toString()
  const content = formData.get('content')?.toString()
  const image_url = formData.get('image_url')?.toString()
  const product_link = formData.get('product_link')?.toString()

  await sql`
    INSERT INTO newsletters (
      title,
      content,
      image_url,
      product_link,
      is_pinned,
      is_sent,
      created_at
    )
    VALUES (
      ${title},
      ${content},
      ${image_url},
      ${product_link},
      false,
      false,
      NOW()
    )
  `

  revalidatePath('/admin/newsletter')
}

async function pinNewsletter(id: string) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE newsletters
    SET is_pinned = true
    WHERE id = ${id}
  `

  revalidatePath('/admin/newsletter')
}

async function sendNewsletter(id: string) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE newsletters
    SET is_sent = true
    WHERE id = ${id}
  `

  revalidatePath('/admin/newsletter')
}

export default async function NewsletterPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  let newsletters: any[] = []

  try {
    newsletters = await sql`
      SELECT *
      FROM newsletters
      ORDER BY created_at DESC
    `
  } catch (err) {
    console.error(err)
  }

  return (
    <div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Newsletter</h1>
        <p className="text-gray-500 text-sm mt-1">
          Create and manage announcements for your customers.
        </p>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">

        <h2 className="font-bold text-[#111111] mb-4">Create Newsletter</h2>

        <form action={createNewsletter} className="space-y-3">

          <input
            name="title"
            placeholder="Title"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            required
          />

          <textarea
            name="content"
            placeholder="Content"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            rows={4}
            required
          />

          <input
            name="image_url"
            placeholder="Image URL"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          />

          <input
            name="product_link"
            placeholder="Product Link (optional)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          />

          <button
            type="submit"
            className="bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600"
          >
            Create Newsletter
          </button>

        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">All Newsletters</h2>
        </div>

        {newsletters.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No newsletters created yet.
          </div>
        ) : (
          <table className="w-full">

            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="text-left px-6 py-3">Title</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">

              {newsletters.map((n: any) => (
                <tr key={n.id} className="hover:bg-gray-50">

                  <td className="px-6 py-4 text-sm text-[#111111]">
                    {n.title}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {n.is_sent ? 'Sent' : 'Draft'}{' '}
                    {n.is_pinned ? '(Pinned)' : ''}
                  </td>

                  <td className="px-6 py-4 flex gap-2">

                    <form action={pinNewsletter.bind(null, n.id)}>
                      <button className="px-3 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                        Pin
                      </button>
                    </form>

                    <form action={sendNewsletter.bind(null, n.id)}>
                      <button className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600">
                        Send
                      </button>
                    </form>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>
    </div>
  )
}
