'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface HeroSlide {
  id: string;
  image_url: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  autoplay_delay: number;
}

interface HeroCarouselProps {
  titleColor?: string;
  subtitleColor?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  subtitleAlignment?: 'left' | 'center' | 'right';
  verticalPosition?: 'top' | 'center' | 'bottom';
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export default function HeroCarousel({
  titleColor = '#FFFFFF',
  subtitleColor = '#FFFFFF',
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  verticalPosition = 'bottom',
  buttonBgColor = '#F97316',
  buttonTextColor = '#FFFFFF',
}: HeroCarouselProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setSlides(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-[250px] xs:h-[300px] sm:h-[400px] md:h-[450px] bg-gray-100 animate-pulse rounded-2xl" />;
  }

  if (slides.length === 0) return null;

  const verticalClass = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  }[verticalPosition];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation
        loop={slides.length > 1}
        className="w-full h-[250px] xs:h-[300px] sm:h-[400px] md:h-[450px]"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              <Image
                src={slide.image_url}
                alt={slide.title || 'Hero'}
                fill
                className="object-cover"
                priority={idx === 0}
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
              <div className={`absolute inset-0 flex flex-col ${verticalClass} justify-center p-4 sm:p-6`}>
                <div className="container mx-auto px-2 sm:px-4 text-center">
                  {slide.title && (
                    <h2
                      className="text-lg xs:text-xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg mb-1 sm:mb-2"
                      style={{ color: titleColor, textAlign: titleAlignment }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.description && (
                    <p
                      className="text-xs xs:text-sm sm:text-base md:text-lg drop-shadow max-w-2xl mx-auto px-2"
                      style={{ color: subtitleColor, textAlign: subtitleAlignment }}
                    >
                      {slide.description}
                    </p>
                  )}
                  {slide.button_text && slide.button_link && (
                    <div className="mt-2 sm:mt-4" style={{ textAlign: titleAlignment }}>
                      <Link
                        href={slide.button_link}
                        className="inline-block px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition hover:opacity-90"
                        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                      >
                        {slide.button_text}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          background: rgba(0,0,0,0.3);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background: rgba(0,0,0,0.6);
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 12px;
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
        @media (min-width: 640px) {
          .swiper-button-next,
          .swiper-button-prev {
            width: 35px;
            height: 35px;
          }
          .swiper-button-next:after,
          .swiper-button-prev:after {
            font-size: 14px;
          }
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
