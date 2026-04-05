'use client'
import { Star } from 'lucide-react'
export default function StarRating({ rating, interactive=false, onRate, size=18 }: { rating:number, interactive?:boolean, onRate?:(r:number)=>void, size?:number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type={interactive?'button':undefined} onClick={() => interactive && onRate?.(s)} className={interactive?'cursor-pointer hover:scale-110 transition-transform':'cursor-default'} disabled={!interactive}>
          <Star size={size} className={s<=rating?'text-[#F97316] fill-[#F97316]':'text-gray-200 fill-gray-200'} />
        </button>
      ))}
    </div>
  )
}
