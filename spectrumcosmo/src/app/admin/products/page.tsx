'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Loader2, Package } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Hoodies','Pendants','Bracelets']
const EMPTY = { name:'', description:'', price:'', image_url:'', category:'T-Shirts' }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/products')
    setProducts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  const openEdit = (p: any) => { setEditing(p); setForm({name:p.name,description:p.description||'',price:String(p.price),image_url:p.image_url||'',category:p.category}); setError(''); setShowModal(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    const method = editing?'PATCH':'POST'
    const body = editing?{id:editing.id,...form}:form
    const res = await fetch('/api/products', {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)})
    if (res.ok) { setShowModal(false); fetch_() }
    else { const d = await res.json(); setError(d.error||'Failed') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products?id=${id}`, {method:'DELETE'})
    fetch_()
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[#111111]">Products</h1><p className="text-gray-500 text-sm mt-1">{products.length} products in your store</p></div>
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={16}/>Add Product</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F97316]" size={32}/></div>
        : products.length===0 ? <div className="text-center py-20"><Package size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-400">No products yet.</p></div>
        : <div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="text-left px-6 py-3">Product</th><th className="text-left px-6 py-3">Category</th>
              <th className="text-left px-6 py-3">Price</th><th className="text-right px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.image_url ? <Image src={p.image_url} alt={p.name} width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-gray-300"/></div>}
                      </div>
                      <div><p className="font-medium text-sm text-[#111111]">{p.name}</p>{p.description&&<p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{p.description}</p>}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="badge bg-orange-50 text-orange-700">{p.category}</span></td>
                  <td className="px-6 py-4 font-semibold text-[#F97316]">${parseFloat(p.price).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={()=>openEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15}/></button>
                      <button onClick={()=>del(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#111111]">{editing?'Edit Product':'Add Product'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="label">Name *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required className="input" placeholder="Product name"/></div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className="input resize-none" placeholder="Description..."/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Price ($) *</label><input type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} required className="input" placeholder="29.99"/></div>
                <div><label className="label">Category *</label><select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="input">{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="label">Image URL</label><input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} className="input" placeholder="https://..."/></div>
              {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center text-sm py-2.5">
                  {saving?<Loader2 size={15} className="animate-spin"/>:(editing?'Save Changes':'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
