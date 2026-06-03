// components/storefront/RequestCarousel.tsx
'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Heart, Users, Calendar, TrendingUp, Loader2, Sparkles } from 'lucide-react';
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
  like_count: number;
  user_liked: number;
  image_count: number;
  created_at: string;
}

export default function RequestCarousel() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/requests/public?limit=20');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('RequestCarousel API Response:', data);
      
      // Handle the response format from your API
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
      setError('Unable to load community requests');
      setRequests([]);
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={28} className="text-red-400" />
        </div>
        <p className="text-gray-500">{error}</p>
        <button 
          onClick={fetchRequests} 
          className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
        >
          Try again →
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Requests Yet</h3>
        <p className="text-gray-500 mb-4">Be the first to suggest a product you'd love to see!</p>
        <Link href="#submit-request" className="inline-block bg-orange-500 text-white px-6 py-2.5 rounded-full font-medium hover:bg-orange-600 transition shadow-sm">
          Submit a Request
        </Link>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-4">
          <TrendingUp size={16} className="text-orange-600" />
          <span className="text-sm font-medium text-orange-600">Community Driven</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Trending Community Requests</h2>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Most requested items by our community. Vote for what you want to see next
        </p>
      </div>

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        pagination={{ clickable: true }}
        navigation
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="pb-14"
      >
        {requests.map((req) => (
          <SwiperSlide key={req.id}>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
              {/* Request Image */}
              <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200">
                {req.image_count > 0 ? (
                  <Image
                    src={`/api/requests/${req.id}/image?index=0`}
                    alt={req.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/400x300?text=Request+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Heart size={48} strokeWidth={1} />
                    <span className="text-sm mt-2">Request Image</span>
                  </div>
                )}
                
                {/* Request Badge */}
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                  Request
                </div>
                
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Add like functionality here
                  }}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition duration-200"
                >
                  <Heart
                    size={18}
                    className={req.user_liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
              </div>
              
              {/* Request Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-orange-500 transition">
                  {req.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {req.description}
                </p>
                
                {/* Request Stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Heart size={14} className="text-red-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      {req.like_count} votes
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Category Tag */}
                <div className="mt-3">
                  <span className="inline-block text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600">
                    {req.category_name || 'General Request'}
                  </span>
                </div>
                
                {/* Vote CTA */}
                <Link
                  href={`/requests/${req.id}`}
                  className="mt-4 w-full block text-center bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 font-medium py-2 rounded-xl transition text-sm"
                >
                  View Request Details →
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
