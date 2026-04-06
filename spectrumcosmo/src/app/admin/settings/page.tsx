'use client'
import { useState, useEffect } from 'react'
import { KeyRound, Loader2, Save, FileText, Send, CreditCard, Truck, Plus, Trash2, Pencil, X, Check } from 'lucide-react'

export default function SettingsPage() {
  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')

  // Site content
  const [aboutUs, setAboutUs] = useState('')
  const [newsletter, setNewsletter] = useState('')
  const [contentSaving, setContentSaving] = useState(false)
  const [contentMsg, setContentMsg] = useState('')

  // Payments
  const [payments, setPayments] = useState<any[]>([])
  const [paymentModal, setPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState({ type: 'mobile_wallet', name: '', details: '', logo_url: '' })

  // Delivery
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [deliveryModal, setDeliveryModal] = useState(false)
  const [editingDelivery, setEditingDelivery] = useState<any>(null)
  const [deliveryForm, setDeliveryForm] = useState({ name: '', price: '', logo_url: '' })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      setAboutUs(data.about_us || '')
      setNewsletter(data.newsletter || '')
      setPayments(data.payments || [])
      setDeliveries(data.deliveries || [])
    })
  }, [])

  // Password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwLoading(true); setPwMessage(''); setPwError('')
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    setPwLoading(false)
    if (res.ok) { setPwMessage('Password updated!'); setCurrentPassword(''); setNewPassword('') }
    else setPwError(data.error || 'Failed to update password.')
  }

  // Save site content
  async function saveContent() {
    setContentSaving(true); setContentMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ about_us: aboutUs, newsletter })
    })
    setContentSaving(false)
    if (res.ok) setContentMsg('Saved!')
    setTimeout(() => setContentMsg(''), 3000)
  }

  // Payment CRUD
  async function savePayment() {
    setSaving(true)
    const method = editingPayment ? 'PUT' : 'POST'
    const body = editingPayment ? { ...paymentForm, id: editingPayment.id } : paymentForm
    const res = await fetch('/api/admin/payments', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const data = await res.json()
    if (res.ok) {
      if (editingPayment) setPayments(prev => prev.map(p => p.id === editingPayment.id ? data.payment : p))
      else setPayments(prev => [...prev, data.payment])
      setPaymentModal(false); setEditingPayment(null)
      setPaymentForm({ type: 'mobile_wallet', name: '', details: '', logo_url: '' })
    }
    setSaving(false)
  }

  async function deletePayment(id: string) {
    if (!confirm('Delete this payment option?')) return
    await fetch('/api/admin/payments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setPayments(prev => prev.filter(p => p.id !== id))
  }

  async function togglePayment(id: string, is_active: boolean) {
    await fetch('/api/admin/payments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !is_active }) })
    setPayments(prev => prev.map(p => p.id === id ? { ...p, is_active: !is_active } : p))
  }

  // Delivery CRUD
  async function saveDelivery() {
    setSaving(true)
    const method = editingDelivery ? 'PUT' : 'POST'
    const body = editingDelivery ? { ...deliveryForm, id: editingDelivery.id } : deliveryForm
    const res = await fetch('/api/admin/delivery', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const data = await res.json()
    if (res.ok) {
      if (editingDelivery) setDeliveries(prev => prev.map(d => d.id === editingDelivery.id ? data.delivery : d))
      else setDeliveries(prev => [...prev, data.delivery])
      setDeliveryModal(false); setEditingDelivery(null)
      setDeliveryForm({ name: '', price: '', logo_url: '' })
    }
    setSaving(false)
  }

  async function deleteDelivery(id: string) {
    if (!confirm('Delete this delivery method?')) return
    await fetch('/api/admin/delivery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setDeliveries(prev => prev.filter(d => d.id !== id))
  }

  const mobileWallets = payments.filter(p => p.type === 'mobile_wallet')
  const banks = payments.filter(p => p.type === 'bank')

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Settings & Content</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store content, payments, and delivery.</p>
      </div>

      <div className="space-y-8">

        {/* ── Site Content ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><FileText size={20} /></div>
              <h2 className="font-bold text-[#111111]">Site Content</h2>
            </div>
            {contentMsg && <span className="text-green-600 text-sm font-medium">{contentMsg}</span>}
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">About Us Text</label>
              <textarea className="input resize-none min-h-[120px]" value={aboutUs}
                onChange={e => setAboutUs(e.target.value)}
                placeholder="Tell your brand story..." />
            </div>
            <div>
              <label className="label">Newsletter / Announcement</label>
              <textarea className="input resize-none min-h-[120px]" value={newsletter}
                onChange={e => setNewsletter(e.target.value)}
                placeholder="Latest news or announcement..." />
            </div>
          </div>
          <div className="px-6 pb-6">
            <button onClick={saveContent} disabled={contentSaving} className="btn-primary gap-2">
              {contentSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Content
            </button>
          </div>
        </div>

        {/* ── Payment Options ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><CreditCard size={20} /></div>
              <h2 className="font-bold text-[#111111]">Payment Options</h2>
            </div>
            <button onClick={() => { setEditingPayment(null); setPaymentForm({ type: 'mobile_wallet', name: '', details: '', logo_url: '' }); setPaymentModal(true) }}
              className="btn-primary text-sm gap-1"><Plus size={15} /> Add</button>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Mobile Wallets */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📱 Mobile Wallets</p>
              <div className="space-y-2">
                {mobileWallets.length === 0 && <p className="text-sm text-gray-400">No mobile wallets added.</p>}
                {mobileWallets.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.is_active ? 'border-green-100 bg-green-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.details}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePayment(p.id, p.is_active)} className={`p-1.5 rounded-lg text-xs ${p.is_active ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`}>
                        {p.is_active ? <X size={14} /> : <Check size={14} />}
                      </button>
                      <button onClick={() => { setEditingPayment(p); setPaymentForm({ type: p.type, name: p.name, details: p.details || '', logo_url: p.logo_url || '' }); setPaymentModal(true) }}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#F97316]"><Pencil size={14} /></button>
                      <button onClick={() => deletePayment(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Banks */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🏦 Banks</p>
              <div className="space-y-2">
                {banks.length === 0 && <p className="text-sm text-gray-400">No banks added.</p>}
                {banks.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.is_active ? 'border-blue-100 bg-blue-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.details}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePayment(p.id, p.is_active)} className={`p-1.5 rounded-lg text-xs ${p.is_active ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`}>
                        {p.is_active ? <X size={14} /> : <Check size={14} />}
                      </button>
                      <button onClick={() => { setEditingPayment(p); setPaymentForm({ type: p.type, name: p.name, details: p.details || '', logo_url: p.logo_url || '' }); setPaymentModal(true) }}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#F97316]"><Pencil size={14} /></button>
                      <button onClick={() => deletePayment(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Delivery Methods ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Truck size={20} /></div>
              <h2 className="font-bold text-[#111111]">Delivery Methods</h2>
            </div>
            <button onClick={() => { setEditingDelivery(null); setDeliveryForm({ name: '', price: '', logo_url: '' }); setDeliveryModal(true) }}
              className="btn-primary text-sm gap-1"><Plus size={15} /> Add</button>
          </div>
          <div className="p-6 space-y-2">
            {deliveries.length === 0 && <p className="text-sm text-gray-400">No delivery methods added.</p>}
            {deliveries.map(d => (
              <div key={d.id} className={`flex items-center justify-between p-3 rounded-xl border ${d.is_active ? 'border-purple-100 bg-purple-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  {d.logo_url && <img src={d.logo_url} alt={d.name} className="w-8 h-8 object-contain rounded" />}
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{d.name}</p>
                    <p className="text-xs text-gray-400">MWK {Number(d.price).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingDelivery(d); setDeliveryForm({ name: d.name, price: String(d.price), logo_url: d.logo_url || '' }); setDeliveryModal(true) }}
                    className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#F97316]"><Pencil size={14} /></button>
                  <button onClick={() => deleteDelivery(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Password ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]"><KeyRound size={20} /></div>
            <h2 className="font-bold text-[#111111]">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4 max-w-md">
            <div>
              <label className="label">Current Password</label>
              <input type="password" required className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" required minLength={8} className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {pwError && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{pwError}</p>}
            {pwMessage && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">{pwMessage}</p>}
            <button type="submit" disabled={pwLoading} className="btn-primary gap-2">
              {pwLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>

      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#111111]">{editingPayment ? 'Edit Payment Option' : 'Add Payment Option'}</h2>
              <button onClick={() => setPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={paymentForm.type} onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })}>
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="label">Name</label>
                <input className="input" value={paymentForm.name} onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })} placeholder="e.g. Airtel Money" />
              </div>
              <div>
                <label className="label">Details (account number / instructions)</label>
                <input className="input" value={paymentForm.details} onChange={e => setPaymentForm({ ...paymentForm, details: e.target.value })} placeholder="e.g. Send to: 0991234567" />
              </div>
              <div>
                <label className="label">Logo URL (optional)</label>
                <input className="input" value={paymentForm.logo_url} onChange={e => setPaymentForm({ ...paymentForm, logo_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setPaymentModal(false)} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={savePayment} disabled={saving} className="flex-1 btn-primary justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {deliveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#111111]">{editingDelivery ? 'Edit Delivery Method' : 'Add Delivery Method'}</h2>
              <button onClick={() => setDeliveryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={deliveryForm.name} onChange={e => setDeliveryForm({ ...deliveryForm, name: e.target.value })} placeholder="e.g. CTS Courier" />
              </div>
              <div>
                <label className="label">Price (MWK)</label>
                <input className="input" type="number" value={deliveryForm.price} onChange={e => setDeliveryForm({ ...deliveryForm, price: e.target.value })} placeholder="2500" />
              </div>
              <div>
                <label className="label">Logo URL (optional)</label>
                <input className="input" value={deliveryForm.logo_url} onChange={e => setDeliveryForm({ ...deliveryForm, logo_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setDeliveryModal(false)} className="flex-1 btn-secondary justify-center">Cancel</button>
              <button onClick={saveDelivery} disabled={saving} className="flex-1 btn-primary justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
