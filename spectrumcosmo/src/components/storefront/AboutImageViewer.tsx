'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function AboutImageViewer({ mode, singleImage, carouselImages }: { mode: string; singleImage: string; carouselImages: string[] }) {
  if (mode === 'carousel' && carouselImages.length > 0) {
    return (
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="w-full h-96 rounded-2xl shadow-xl"
      >
        {carouselImages.map((img, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative w-full h-96">
              <Image src={img} alt={`Slide ${idx + 1}`} fill className="object-cover" priority={idx === 0} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  return (
    <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
      <Image src={singleImage} alt="About SpectrumCosmo" fill className="object-cover" />
    </div>
  );
}
