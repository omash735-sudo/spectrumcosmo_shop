import Image from 'next/image'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

const ABOUT_IMAGE =
  'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_21.52.23_bik6wg.jpg'

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="bg-orange-50">

        {/* HERO SECTION */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">

            {/* IMAGE SIDE */}
            <div className="relative">
              <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={ABOUT_IMAGE}
                  alt="SpectrumCosmo community"
                  fill
                  className="object-cover"
                />
              </div>

              {/* FLOATING STATS */}
              <div className="absolute -bottom-6 -right-6 bg-[#F97316] text-white rounded-2xl p-6 shadow-xl max-w-[200px]">
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-orange-100 mt-1">
                  Happy customers worldwide
                </p>
              </div>
            </div>

            {/* TEXT SIDE */}
            <div>
              <p className="text-[#F97316] font-medium text-sm mb-3 uppercase tracking-widest">
                About SpectrumCosmo
              </p>

              <h1 className="text-4xl font-bold text-[#111111] mb-6 leading-tight">
                Wear your excitement with pride
              </h1>

              <p className="text-gray-600 leading-relaxed mb-5">
                SpectrumCosmo was created from a passion for anime culture and streetwear fashion.
                We believe clothing is not just fabric — it is identity, emotion, and expression.
              </p>

              <p className="text-gray-600 leading-relaxed mb-8">
                Every product we design is carefully crafted with quality materials, bold designs,
                and attention to detail so you can express yourself without limits.
              </p>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: '100%', label: 'Premium Quality' },
                  { number: '48h', label: 'Fast Processing' },
                  { number: 'Nationwide', label: 'Delivery' },
                  { number: '5★', label: 'Customer Rating' }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white rounded-xl p-4 border border-gray-100"
                  >
                    <p className="text-2xl font-bold text-[#F97316]">
                      {item.number}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BRAND STATEMENT SECTION */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto text-center px-4">

            <h2 className="text-3xl font-bold text-[#111111] mb-6">
              More than a brand — a lifestyle
            </h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              At SpectrumCosmo, we don’t just sell clothing. We build identity.
              Every drop is designed for people who want to stand out, not blend in.
            </p>

            <p className="text-gray-600 leading-relaxed">
              From anime-inspired designs to modern streetwear, our goal is simple:
              help you wear what represents your passion.
            </p>

          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 bg-[#111111] text-center">
          <div className="max-w-3xl mx-auto px-4">

            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to wear your excitement?
            </h2>

            <p className="text-gray-400 mb-8">
              Explore our collection and find the piece that represents you.
            </p>

            <a
              href="/products"
              className="inline-block bg-[#F97316] text-white px-8 py-4 rounded-full font-medium hover:bg-orange-600 transition"
            >
              Shop Now
            </a>

          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
