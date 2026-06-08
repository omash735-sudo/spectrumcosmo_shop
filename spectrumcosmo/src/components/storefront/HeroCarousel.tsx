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

// For backward compatibility with old products page
interface LegacySlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

interface HeroCarouselProps {
  slides?: LegacySlide[];  // Support old prop format
  textColor?: string;       // Support old prop format
  autoplayDelay?: number;   // Support old prop format
  // New props for full control
  titleColor?: string;
  subtitleColor?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  subtitleAlignment?: 'left' | 'center' | 'right';
  verticalPosition?: 'top' | 'center' | 'bottom';
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export default function HeroCarousel({ 
  slides: propSlides,
  textColor = '#FFFFFF',
  autoplayDelay = 5000,
  titleColor = '#FFFFFF',
  subtitleColor = '#FFFFFF',
  titleAlignment = 'center',
  subtitleAlignment = 'center',
  verticalPosition = 'bottom',
  buttonBgColor = '#F97316',
  buttonTextColor = '#FFFFFF',
}: HeroCarouselProps) {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If slides passed as prop (old products page), use them directly
    if (propSlides && propSlides.length > 0) {
      console.log('Using slides from prop:', propSlides);
      // Convert legacy format to component format
      const formattedSlides = propSlides.map((slide) => ({
        id: String(slide.id),
        image_url: slide.image,
        title: slide.title,
        description: slide.subtitle || '',
        button_text: '',
        button_link: '',
        autoplay_delay: autoplayDelay,
      }));
      setSlides(formattedSlides);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
    fetch('/api/hero-slides')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Hero slides loaded from API:', data);
        if (data && data.length > 0) {
          setSlides(data);
        } else {
          console.warn('No slides found in API response');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load hero slides:', err);
        setError(true);
        setLoading(false);
      });
  }, [propSlides, autoplayDelay]);

  if (loading) {
    return <div className="h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100 animate-pulse" />;
  }

  if (error) {
    console.warn('HeroCarousel: Error loading slides');
    return null;
  }

  if (slides.length === 0) {
    console.warn('HeroCarousel: No slides to display');
    return null;
  }

  const verticalClass = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  }[verticalPosition];

  // Determine which colors to use (legacy textColor takes priority if using old format)
  const finalTitleColor = propSlides ? textColor : titleColor;
  const finalSubtitleColor = propSlides ? textColor : subtitleColor;

  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: slides[0]?.autoplay_delay || autoplayDelay, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation
        loop={slides.length > 1}
        className="w-full h-[400px] sm:h-[500px] md:h-[600px]"
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
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
              <div className={`absolute inset-0 flex flex-col ${verticalClass} justify-center p-6`}>
                <div className="container mx-auto px-4 text-center">
                  {slide.title && (
                    <h2
                      className="text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-lg mb-4"
                      style={{ color: finalTitleColor, textAlign: titleAlignment }}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.description && (
                    <p
                      className="text-base sm:text-xl md:text-2xl drop-shadow max-w-2xl mx-auto"
                      style={{ color: finalSubtitleColor, textAlign: subtitleAlignment }}
                    >
                      {slide.description}
                    </p>
                  )}
                  {slide.button_text && slide.button_link && (
                    <div className="mt-6" style={{ textAlign: titleAlignment }}>
                      <Link
                        href={slide.button_link}
                        className="inline-block px-6 py-3 rounded-full font-medium transition hover:opacity-90"
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
