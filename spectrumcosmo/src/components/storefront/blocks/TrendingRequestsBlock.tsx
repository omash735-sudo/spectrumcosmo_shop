'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

interface Request {
  id: string;
  title: string;
  description: string;
  like_count: number;
  image_count: number;
  created_at: string;
}

export default function TrendingRequestsBlock({ block }: { block: any }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const res = await fetch('/api/requests?status=approved&limit=6&sort=likes');
      const data = await res.json();
      setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  if (loading) return <div className="py-10 text-center">Loading trending requests...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="my-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{block.title}</h2>
        {block.description && <p className="text-gray-500 mt-1">{block.description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
          <Link key={req.id} href={`/requests/${req.id}`} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 line-clamp-1">{req.title}</h3>
              <div className="flex items-center gap-1 text-sm text-orange-500">
                <Heart size={14} className="fill-orange-500" />
                <span>{req.like_count}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{req.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
