'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Request {
  id: string;
  title: string;
  description: string;
  category_name: string;
  category_id: number | null;
  status: string;
  like_count: number;
  user_liked: number;
  image_count: number;
  created_at: string;
}

export default function RequestCarousel() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests/public?limit=20');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Your API returns { success: true, data: [...] }
      if (data && data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else if (Array.isArray(data)) {
        setRequests(data);
      } else {
        console.error('Unexpected API response:', data);
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const res = await fetch(`/api/requests/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRequests(prev => prev.map(r => 
          r.id === id 
            ? { ...r, like_count: r.like_count + (data.liked ? 1 : -1), user_liked: data.liked ? 1 : 0 }
            : r
        ));
      }
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <p className="text-gray-500">No community requests yet. Be the first to submit one!</p>
        <Link href="/newsletter#submit" className="inline-block mt-3 text-orange-500 hover:text-orange-600 text-sm font-medium">
          Submit a request →
        </Link>
      </div>
    );
  }

  return (
    <div className="my-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Trending Requests</h2>
        <p className="text-gray-500 mt-1">Most liked requests from our community</p>
      </div>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        pagination={{ clickable: true }}
        navigation
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="pb-12"
      >
        {requests.map((req) => (
          <SwiperSlide key={req.id}>
            <Link href={`/requests/${req.id}`} className="block">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {req.image_count > 0 ? (
                    <Image
                      src={`/api/requests/${req.id}/image?index=0`}
                      alt={req.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span className="text-xs mt-2">No image</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleLike(req.id, e)}
                    className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition duration-200"
                  >
                    <Heart
                      size={18}
                      className={req.user_liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-orange-500 transition">
                    {req.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {req.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-orange-500 font-medium">
                      {req.like_count} {req.like_count === 1 ? 'like' : 'likes'}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                      {req.category_name || 'General'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
