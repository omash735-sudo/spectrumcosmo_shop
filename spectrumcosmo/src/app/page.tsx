export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import ProductCard from '@/components/storefront/ProductCard'
import StarRating from '@/components/ui/StarRating'
import LiveProducts from '@/components/storefront/LiveProducts'
import LiveReviews from '@/components/storefront/LiveReviews'
import { getDb } from '@/lib/db'

const CATEGORY_IMAGES = {
'T-Shirts': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
'Hoodies': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
'Pendants': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
'Bracelets': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
}

const ABOUT_IMAGE = 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_21.52.23_bik6wg.jpg'

export default async function HomePage() {
let products: any[] = []
let reviews: any[] = []

try {
const sql = getDb()
;[products, reviews] = await Promise.all([
sqlSELECT * FROM products ORDER BY created_at DESC LIMIT 6,
sqlSELECT * FROM reviews WHERE approved=true ORDER BY created_at DESC LIMIT 8,
])
} catch (err) {
console.error('DB error:', err)
}

return (
<>
<Navbar />
<main>

{/* Hero */}  
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-white">  
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />  
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />  

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">  
        <div>  

          <Link  
            href="/newsletter"  
            className="inline-flex items-center gap-2 bg-orange-50 text-[#F97316] text-sm font-medium px-4 py-1.5 rounded-full mb-6 hover:opacity-80 hover:scale-105 active:scale-95 transition transform"  
          >  
            <Sparkles size={14} /> New collection just dropped  
          </Link>  

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#111111] leading-[1.05] mb-6">  
            Wear your{' '}  
            <span className="text-[#F97316] relative">  
              excitement  
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">  
                <path d="M2 6 C60 2, 130 7, 200 4 S270 2, 298 5" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" fill="none"/>  
              </svg>  
            </span>{' '}  
            with pride.  
          </h1>  

          <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-10">  
            Custom apparel and anime merchandise handcrafted for those who live boldly. T-shirts, hoodies, pendants, bracelets — every piece tells your story.  
          </p>  

          <div className="flex flex-wrap gap-4">  
            <Link href="/products" className="btn-primary text-base px-8 py-4">  
              Shop Now <ArrowRight size={18} />  
            </Link>  
            <Link href="#featured" className="btn-secondary text-base px-8 py-4">  
              View Products  
            </Link>  
          </div>  

          <div className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-gray-100">  
            {[{icon:Shield,label:'Quality Guaranteed'},{icon:Truck,label:'Fast Shipping'},{icon:Sparkles,label:'Unique Designs'}].map(({icon:Icon,label}) => (  
              <div key={label} className="flex items-center gap-2 text-sm text-gray-500">  
                <Icon size={16} className="text-[#F97316]" />  
                {label}  
              </div>  
            ))}  
          </div>  

        </div>  

        <div className="hidden lg:grid grid-cols-2 gap-4">  
          <div className="space-y-4">  
            <div className="relative h-72 rounded-2xl overflow-hidden">  
              <Image src={CATEGORY_IMAGES['T-Shirts']} alt="T-Shirt collection" fill className="object-cover" />  
            </div>  
            <div className="relative h-44 rounded-2xl overflow-hidden">  
              <Image src={CATEGORY_IMAGES['Bracelets']} alt="Bracelet collection" fill className="object-cover" />  
            </div>  
          </div>  
          <div className="space-y-4 pt-8">  
            <div className="relative h-44 rounded-2xl overflow-hidden">  
              <Image src={CATEGORY_IMAGES['Pendants']} alt="Pendant collection" fill className="object-cover" />  
            </div>  
            <div className="relative h-72 rounded-2xl overflow-hidden">  
              <Image src={CATEGORY_IMAGES['Hoodies']} alt="Hoodie collection" fill className="object-cover" />  
            </div>  
          </div>  
        </div>  

      </div>  
    </section>  

    <section className="bg-gradient-to-br from-[#111111] to-gray-900 py-24">  
      <div className="max-w-4xl mx-auto px-4 text-center">  
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">  
          Ready to wear your <span className="text-[#F97316]">excitement?</span>  
        </h2>  

        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">  
          Browse our full collection and find the piece that speaks to your passion.  
        </p>  

        <div className="flex flex-wrap justify-center gap-4">  
          <Link href="/products" className="btn-primary text-base px-8 py-4">  
            Explore Products <ArrowRight size={18} />  
          </Link>  

          <Link  
            href="/reviews/submit"  
            className="border-2 border-white/20 text-white px-8 py-4 rounded-full font-medium hover:border-white/40 hover:bg-white/5 transition-all inline-flex items-center gap-2"  
          >  
            Share Your Story  
          </Link>  
        </div>  
      </div>  
    </section>  

  </main>  
  <Footer />  
</>

)
  }
