export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function createMethod(formData: FormData) {
  'use server'

  const sql = getDb()

  const name = formData.get('name')?.toString()
  const type = formData.get('type')?.toString()
  const logo_url = formData.get('logo_url')?.toString()
  const account_number = formData.get('account_number')?.toString()
  const branch = formData.get('branch')?.toString()
  const instructions = formData.get('instructions')?.toString()

  await sql`
    INSERT INTO payment_methods (
      name,
      type,
      logo_url,
      account_number,
      branch,
      instructions,
      is_active,
      created_at
    )
    VALUES (
      ${name},
      ${type},
      ${logo_url},
      ${account_number},
      ${branch},
      ${instructions},
      true,
      NOW()
    )
  `

  revalidatePath('/admin/payment-methods')
}

async function toggleMethod(id: string, current: boolean) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE payment_methods
    SET is_active = ${!current}
    WHERE id = ${id}
  `

  revalidatePath('/admin/payment-methods')
}

export default async function PaymentMethodsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  let methods: any[] = []

  try {
    methods = await sql`
      SELECT *
      FROM payment_methods
      ORDER BY created_at DESC
    `
  } catch (err) {
    console.error(err)
  }

  return (
    <div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Payment Methods</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage available payment options for customers.
        </p>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">

        <h2 className="font-bold text-[#111111] mb-4">Add Payment Method</h2>

        <form action={createMethod} className="space-y-3">

          <input
            name="name"
            placeholder="Method name (e.g Airtel Money)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            required
          />

          <input
            name="type"
            placeholder="Type (mobile money, bank, cash)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          />

          <input
            name="logo_url"
            placeholder="Logo URL"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          />

          <input
            name="account_number"
            placeholder="Account / Number"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          />

          <input
            name="branch"
            placeholder="Branch (optional)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          />

          <textarea
            name="instructions"
            placeholder="Instructions for customers"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            rows={3}
          />

          <button
            type="submit"
            className="bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600"
          >
            Add Method
          </button>

        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Available Methods</h2>
        </div>

        {methods.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No payment methods found.
          </div>
        ) : (
          <table className="w-full">

            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Details</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">

              {methods.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">

                  <td className="px-6 py-4 text-sm text-[#111111]">
                    {m.name}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.type}
                  </td>

                  <td className="px-6 py-4 text-xs text-gray-500">
                    {m.account_number || '—'}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {m.is_active ? 'Active' : 'Disabled'}
                  </td>

                  <td className="px-6 py-4">

                    <form action={toggleMethod.bind(null, m.id, m.is_active)}>
                      <button className="px-3 py-1 text-xs rounded-lg bg-gray-800 text-white hover:bg-black">
                        Toggle
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
