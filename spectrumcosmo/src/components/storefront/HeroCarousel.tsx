'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Image from 'next/image';

type Slide = {
  id: number;
  image: string;
  title: string;
  subtitle?: string;
};

interface HeroCarouselProps {
  slides: Slide[];
  // Styling options (now fully configurable)
  titleColor?: string;
  subtitleColor?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  subtitleAlignment?: 'left' | 'center' | 'right';
  verticalPosition?: 'top' | 'center' | 'bottom';
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonLabel?: string;
  buttonLink?: string;
  autoplayDelay?: number;
}

export default function HeroCarousel({
  slides,
  titleColor = '#FFFFFF',
  subtitleColor = '#FFFFFF',
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  verticalPosition = 'bottom',
  buttonBgColor = '#F97316',
  buttonTextColor = '#FFFFFF',
  buttonLabel = '',
  buttonLink = '',
  autoplayDelay = 5000,
}: HeroCarouselProps) {
  // Map vertical position to Tailwind classes
  const verticalClass = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  }[verticalPosition];

  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: autoplayDelay, disableOnInteraction: false }}
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
              {/* Overlay with dynamic positioning */}
              <div className={`absolute inset-0 flex flex-col ${verticalClass} justify-center p-6`}>
                <div className="container mx-auto px-4 text-center">
                  {slide.title && (
                    <h2
                      className="text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-lg mb-4"
                      style={{ color: titleColor, textAlign: titleAlignment }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p
                      className="text-base sm:text-xl md:text-2xl drop-shadow"
                      style={{ color: subtitleColor, textAlign: subtitleAlignment }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  {buttonLabel && buttonLink && (
                    <div className="mt-6" style={{ textAlign: titleAlignment }}>
                      <a
                        href={buttonLink}
                        className="inline-block px-6 py-3 rounded-full font-medium transition hover:opacity-90"
                        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                      >
                        {buttonLabel}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {/* Gradient overlay (optional – can be controlled later) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

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
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
