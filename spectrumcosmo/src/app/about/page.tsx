import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default async function AboutPage() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'about'`;
  const content = row?.content || {};

  // Fallback values
  const history = content.history || '';
  const vision = content.vision || 'To become the go-to destination for anime merchandise in Malawi and beyond.';
  const mission = content.mission || 'Celebrate anime passion and help fans express themselves proudly.';
  const stats = content.stats || [
    { value: '2024', label: 'Year Started' },
    { value: '1000+', label: 'Products Sold' },
    { value: '400+', label: 'Community Members' },
    { value: '5+', label: 'Countries Served' }
  ];
  const team = content.team || [];
  const futurePlans = content.future_plans || 'Participate in conventions, host watch parties, support local anime culture.';
  const imageMode = content.image_mode || 'single';
  const singleImage = content.single_image_url || 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_21.52.23_bik6wg.jpg';
  const carouselImages = content.carousel_images || [];

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Hero Section with dynamic image */}
        <section className="py-16 md:py-24 bg-orange-50">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image / Carousel */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              {imageMode === 'carousel' && carouselImages.length > 0 ? (
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  spaceBetween={0}
                  slidesPerView={1}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  navigation
                  loop
                  className="w-full h-96"
                >
                  {carouselImages.map((img: string, idx: number) => (
                    <SwiperSlide key={idx}>
                      <div className="relative w-full h-96">
                        <Image src={img} alt={`Slide ${idx + 1}`} fill className="object-cover" priority={idx === 0} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="relative h-96">
                  <Image src={singleImage} alt="SpectrumCosmo community" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Right: Text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">About SpectrumCosmo</h1>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">{history}</div>
            </div>
          </div>
        </section>

        {/* Vision & Mission (unchanged) */}
        <section className="py-16 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8 text-center md:text-left">
          <div className="bg-gray-50 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-[#F97316] mb-3">Vision</h2>
            <p className="text-gray-600">{vision}</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-[#F97316] mb-3">Mission</h2>
            <p className="text-gray-600">{mission}</p>
          </div>
        </section>

        {/* Statistics (unchanged) */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat: any, idx: number) => (
                <div key={idx} className="text-center bg-orange-50 p-6 rounded-2xl">
                  <div className="text-4xl font-bold text-[#F97316]">{stat.value}</div>
                  <div className="text-gray-600 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section (unchanged, but dynamic) */}
        {team.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Meet the Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {team.map((member: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl text-center shadow-sm">
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden mb-4">
                      {member.image ? (
                        <Image src={member.image} alt={member.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <p className="text-gray-500">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Future Plans & CTA (unchanged) */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-6">What's Next</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{futurePlans}</p>
          </div>
        </section>

        <section className="py-20 bg-[#111111] text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-white mb-6">Join Our Community</h2>
            <p className="text-gray-400 mb-8">Be part of the growing anime culture in Malawi.</p>
            <Link href="/products" className="inline-block bg-[#F97316] text-white px-8 py-4 rounded-full font-medium hover:bg-orange-600 transition">
              Shop Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
