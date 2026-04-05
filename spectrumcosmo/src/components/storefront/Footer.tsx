import Link from 'next/link'
import { ShoppingBag, Instagram, Twitter, Mail } from 'lucide-react'
export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center"><ShoppingBag size={18} className="text-white" /></div>
              <span className="text-xl font-bold" style={{fontFamily:'var(--font-display)'}}>SpectrumCosmo</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Wear your excitement with pride. Custom apparel and anime merchandise crafted for those who live boldly.</p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors"><Instagram size={16} /></a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors"><Twitter size={16} /></a>
              <a href="mailto:hello@spectrumcosmo.com" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors"><Mail size={16} /></a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {[{href:'/',label:'Home'},{href:'/products',label:'Products'},{href:'/reviews/submit',label:'Write a Review'},{href:'/#reviews',label:'Customer Reviews'}].map(l => (
                <li key={l.href}><Link href={l.href} className="text-sm text-gray-400 hover:text-[#FDBA74] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>spectrumcosmo01@gmail.com</li>
              <li>Mon–Fri, 9am–6pm WAT</li>
              <li className="pt-2"><Link href="/products" className="inline-flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#ea6c0f] transition-colors">Shop the Collection</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2024 SpectrumCosmo. All rights reserved.</p>
          <p className="text-xs text-gray-500 italic">"Wear your excitement with pride."</p>
        </div>
      </div>
    </footer>
  )
}
