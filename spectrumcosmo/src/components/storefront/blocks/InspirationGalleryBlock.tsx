'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface InspirationImage {
  id: string;
  image_url: string;
  title: string;
  description: string;
  like_count: number;
  user_liked: boolean;
}

export default function InspirationGalleryBlock({ block }: { block: any }) {
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { limit = 12, autoplay = false, autoplay_delay = 5000 } = block.content || {};

  useEffect(() => {
    const fetchInspirations = async () => {
      try {
        const res = await fetch(`/api/inspiration-images?limit=${limit}`);
        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error('Failed to fetch inspiration images:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInspirations();
  }, [limit]);

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/inspiration-images/${id}/like`, { method: 'POST' });
      const data = await res.json();
      setImages(prev => prev.map(img =>
        img.id === id
          ? { ...img, like_count: img.like_count + (data.liked ? 1 : -1), user_liked: data.liked }
          : img
      ));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Loading inspiration...</div>;
  if (images.length === 0) return null;

  return (
    <div className="my-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{block.title}</h2>
        {block.description && <p className="text-gray-500 mt-1">{block.description}</p>}
      </div>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
          1280: { slidesPerView: 5 },
        }}
        pagination={{ clickable: true }}
        navigation={images.length > 4}
        autoplay={autoplay ? { delay: autoplay_delay, disableOnInteraction: false } : false}
        className="pb-12"
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <div className="group cursor-pointer">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={img.image_url}
                  alt={img.title || 'Inspiration'}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleLike(img.id);
                  }}
                  className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:scale-105 transition"
                >
                  <Heart
                    size={16}
                    className={img.user_liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
                {img.like_count > 0 && (
                  <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {img.like_count}
                  </span>
                )}
              </div>
              {img.title && <p className="text-sm font-medium mt-2 line-clamp-1">{img.title}</p>}
              {img.description && <p className="text-xs text-gray-500 line-clamp-2">{img.description}</p>}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
