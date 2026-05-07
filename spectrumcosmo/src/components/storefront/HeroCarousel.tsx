'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Image from 'next/image';

const slides = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1778101210/pc97xdh08ivrbtvdzins.jpg',
    title: 'Anime Apparel',
    subtitle: 'Wear your passion',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1775346088/WhatsApp_Image_2026-04-03_at_16.15.20_bgw3gq.jpg',
    title: 'Exclusive Hoodies',
    subtitle: 'Limited collection',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1775339426/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
    title: 'Signature Pendants',
    subtitle: 'Complete your look',
  },
];

export default function HeroCarousel() {
  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation
        loop={true}
        className="w-full h-[400px] sm:h-[500px] md:h-[600px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={slide.id === 1}
                sizes="100vw"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              <div className="absolute bottom-8 left-0 right-0 text-center text-white px-4">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-base sm:text-xl md:text-2xl mt-2 drop-shadow">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom styles for pagination and navigation */}
      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          background: rgba(0,0,0,0.4);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background: rgba(0,0,0,0.7);
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.6;
        }
        .swiper-pagination-bullet-active {
          background: #F97316 !important;
          opacity: 1;
        }
        @media (max-width: 640px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: none; /* hide arrows on mobile, use pagination dots instead */
          }
        }
      `}</style>
    </div>
  );
}
