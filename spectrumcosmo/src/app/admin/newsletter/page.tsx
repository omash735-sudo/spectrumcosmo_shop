export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import Link from 'next/link'

export default async function NewsletterPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  const newsletters = await sql`
    SELECT *
    FROM newsletter
    ORDER BY created_at DESC
  `

  return (
    <div className="pt-16 lg:pt-0">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Newsletter</h1>
        <p className="text-gray-500 text-sm mt-1">
          Create, manage and send newsletters.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-400">
          {newsletters.length} total posts
        </p>

        <Link
          href="/admin/newsletter/new"
          className="bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          Create Newsletter
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">All Newsletters</h2>
        </div>

        {newsletters.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No newsletters created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Content</th>
                  <th className="px-6 py-3 text-left">Image</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">

                {newsletters.map((n: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">

                    <td className="px-6 py-4 font-medium text-sm">
                      {n.title}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[250px] truncate">
                      {n.content}
                    </td>

                    <td className="px-6 py-4">
                      {n.image_url ? (
                        <img
                          src={n.image_url}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={async () => {
                          await fetch('/api/newsletter/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: n.id }),
                          })
                          alert('Newsletter sent')
                        }}
                        className="bg-[#F97316] text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Send
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </div>
  )
}
