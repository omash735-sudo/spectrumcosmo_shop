'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Loader2, Trash2, Check, X, MessageSquare } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'pending'|'approved'>('all')
  const [processingId, setProcessingId] = useState<string|null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reviews')
    const data = await res.json()
    setReviews(Array.isArray(data)?data:[])
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const update = async (id: string, updates: any) => {
    setProcessingId(id)
    await fetch('/api/reviews', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,...updates})})
    await fetch_()
    setProcessingId(null)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this review?')) return
    await fetch(`/api/reviews?id=${id}`, {method:'DELETE'})
    fetch_()
  }

  const filtered = reviews.filter(r => filter==='pending'?!r.approved:filter==='approved'?r.approved:true)
  const pendingCount = reviews.filter(r=>!r.approved).length

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8"><h1 className="text-2xl font-bold text-[#111111]">Reviews</h1>
        <p className="text-gray-500 text-sm mt-1">{pendingCount>0&&<span className="text-[#F97316] font-medium">{pendingCount} pending · </span>}{reviews.length} total</p>
      </div>
      <div className="flex gap-2 mb-6">
        {(['all','pending','approved'] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter===f?'bg-[#F97316] text-white':'bg-white border border-gray-200 text-gray-600 hover:border-orange-200'}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}{f==='pending'&&pendingCount>0&&<span className="ml-1.5 bg-white/30 text-inherit text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading?<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F97316]" size={32}/></div>
        :filtered.length===0?<div className="text-center py-20"><MessageSquare size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-400">No reviews found.</p></div>
        :<div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="text-left px-6 py-3">Customer</th><th className="text-left px-6 py-3">Rating</th>
              <th className="text-left px-6 py-3">Review</th><th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Date</th><th className="text-right px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r:any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${!r.approved?'bg-yellow-50/30':''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {r.image_url?<Image src={r.image_url} alt={r.customer_name} width={36} height={36} className="rounded-full object-cover w-9 h-9 flex-shrink-0"/>
                      :<div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-[#F97316]">{r.customer_name.charAt(0).toUpperCase()}</span></div>}
                      <span className="text-sm font-medium text-[#111111]">{r.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StarRating rating={r.rating} size={14}/></td>
                  <td className="px-6 py-4 max-w-xs"><p className="text-xs text-gray-600 line-clamp-2">{r.review_text}</p></td>
                  <td className="px-6 py-4"><span className={`badge ${r.approved?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.approved?'Approved':'Pending'}</span></td>
                  <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {processingId===r.id?<Loader2 size={16} className="animate-spin text-[#F97316]"/>
                      :<>
                        {!r.approved?<button onClick={()=>update(r.id,{approved:true})} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Approve"><Check size={15}/></button>
                        :<button onClick={()=>update(r.id,{approved:false})} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Unapprove"><X size={15}/></button>}
                        <button onClick={()=>del(r.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={15}/></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
    </div>
  )
}
