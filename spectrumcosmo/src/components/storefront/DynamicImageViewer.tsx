// components/storefront/DynamicImageViewer.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
// CSS imports – moved to top level to avoid module resolution errors
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function DynamicImageViewer({
  mode,
  singleImage,
  carouselImages,
}: {
  mode: string;
  singleImage: string;
  carouselImages: string[];
}) {
  const [isClient, setIsClient] = useState(false);
  const [SwiperModule, setSwiperModule] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import Swiper React components and modules (only client-side)
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
  }, []);

  // Fallback for server-side or before Swiper loads
  if (!isClient || !SwiperModule) {
    const fallbackImage =
      mode === 'carousel' && carouselImages.length > 0 ? carouselImages[0] : singleImage;
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
                <Image
                  src={img}
                  alt={`Slide ${idx + 1}`}
                  fill
                  className="object-cover"
                  priority={idx === 0}
                />
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
