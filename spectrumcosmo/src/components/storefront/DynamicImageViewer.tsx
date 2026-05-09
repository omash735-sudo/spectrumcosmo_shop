'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function DynamicImageViewer({ mode, singleImage, carouselImages }: { mode: string; singleImage: string; carouselImages: string[] }) {
  const [isClient, setIsClient] = useState(false);
  const [SwiperModule, setSwiperModule] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import Swiper and its modules only on client
    Promise.all([
      import('swiper/react'),
      import('swiper/modules'),
    ]).then(([swiperReact, swiperModules]) => {
      setSwiperModule({
        Swiper: swiperReact.Swiper,
        SwiperSlide: swiperReact.SwiperSlide,
        Autoplay: swiperModules.Autoplay,
        Pagination: swiperModules.Pagination,
        Navigation: swiperModules.Navigation,
      });
    });
    // Also load CSS dynamically (optional, but CSS won't break server)
    import('swiper/css');
    import('swiper/css/pagination');
    import('swiper/css/navigation');
  }, []);

  // While loading or on server, show a static fallback (first image)
  if (!isClient || !SwiperModule) {
    const fallbackImage = mode === 'carousel' && carouselImages.length > 0 ? carouselImages[0] : singleImage;
    return (
      <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
        <Image src={fallbackImage} alt="About SpectrumCosmo" fill className="object-cover" />
      </div>
    );
  }

  const { Swiper, SwiperSlide, Autoplay, Pagination, Navigation } = SwiperModule;

  if (mode === 'carousel' && carouselImages.length > 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
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
          {carouselImages.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-96">
                <Image src={img} alt={`Slide ${idx + 1}`} fill className="object-cover" priority={idx === 0} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  }

  return (
    <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
      <Image src={singleImage} alt="About SpectrumCosmo" fill className="object-cover" />
    </div>
  );
}
