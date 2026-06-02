'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Heart } from 'lucide-react';
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
    try {
      // Use the public API endpoint (no auth required)
      const res = await fetch('/api/requests/public?limit=20');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Handle the response format { success: true, data: [] }
      if (data.success && Array.isArray(data.data)) {
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
    e.preventDefault(); // Prevent Link navigation
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
      <div className="text-center py-10 text-gray-500">
        Loading requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No community requests yet. Be the first to submit one!
      </div>
    );
  }

  return (
    <div className="my-12">
      <div className="text-center mb-6">
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
        }}
        pagination={{ clickable: true }}
        navigation
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="pb-12"
      >
        {requests.map((req) => (
          <SwiperSlide key={req.id}>
            <Link href={`/requests/${req.id}`} className="block">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group">
                <div className="relative h-48 bg-gray-100">
                  {req.image_count > 0 ? (
                    <Image
                      src={`/api/requests/${req.id}/image?index=0`}
                      alt={req.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                  <button
                    onClick={(e) => handleLike(req.id, e)}
                    className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-105 transition"
                  >
                    <Heart
                      size={18}
                      className={req.user_liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-1">{req.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-orange-500 font-medium">{req.like_count} likes</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
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
