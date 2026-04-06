'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Package } from 'lucide-react'

const STATUSES = ['in_stock', 'sold', 'coming_soon']
const CURRENCIES = ['MWK', 'USD', 'ZAR', 'KES', 'GBP', 'EUR']
const STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  sold: 'Sold',
  coming_soon: 'Coming Soon'
}
const STATUS_COLORS: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-700',
  sold: 'bg-red-100 text-red-700',
  coming_soon: 'bg-blue-100 text-blue-700'
}

const EMPTY = { name: '', description: '', price: '', currency: 'MWK', image_url: '', category: '', status: 'in_stock' }

export default function AdminProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openNew() { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(p: any) { setEditing(p); setForm({ ...p, price: String(p.price) }); setModal(true) }
  function closeModal() { setModal(false); setError('') }

  async function handleSave() {
    if (!form.name || !form.price || !form.category) { setError('Name, price and category are required'); return }
    setSaving(true); setError('')
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...form, id: editing.id } : form
      const res = await fetch('/api/admin/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      if (editing) {
        setProducts(prev => prev.map(p => p.id === editing.id ? data.product : p))
      } else {
        setProducts(prev => [data.product, ...prev])
      }
      closeModal()
    } catch { setError('Something went wrong') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    const res = await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setProducts(prev => prev.filter(p => p.id !== id))
  }

  async function quickStatus(id: string, status: string) {
    const res = await fetch('/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    if (res.ok) setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products total</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Package size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No products yet. Add your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-left px-6 py-3">Price</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-[#111111]">{p.name}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#111111]">
                      {p.currency} {Number(p.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={p.status || 'in_stock'}
                        onChange={e => quickStatus(p.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${STATUS_COLORS[p.status || 'in_stock']}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#F97316] transition-all">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div>
                <label className="label">Product Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Naruto Hoodie" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price *</label>
                  <input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hoodies" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Image URL</label>
                <input className="input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="w-full h-40 object-cover rounded-xl" />
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={closeModal} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary justify-center">
                {saving ? 'Saving...' : <><Check size={16} /> {editing ? 'Update' : 'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
