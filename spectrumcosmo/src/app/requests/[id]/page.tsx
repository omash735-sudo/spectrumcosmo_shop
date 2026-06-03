// app/requests/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import { ArrowLeft, Heart, Calendar, Share2 } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  like_count: number;
  created_at: string;
  category_name: string;
  user_name?: string;
  images: Array<{ id: string; image_url: string; display_order: number }>;
}

async function getRequest(id: string): Promise<RequestDetail | null> {
  const sql = getDb();
  
  const [request] = await sql`
    SELECT 
      r.id,
      r.title,
      r.description,
      r.status,
      r.like_count,
      r.created_at,
      c.name as category_name,
      u.name as user_name
    FROM product_requests r
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.id = ${id}
  `;
  
  if (!request) return null;
  
  const images = await sql`
    SELECT id, image_url, display_order
    FROM request_images
    WHERE request_id = ${id}
    ORDER BY display_order ASC
  `;
  
  return { ...request, images };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'approved':
      return 'This request is approved and will be considered for production';
    case 'pending':
      return 'This request is under review by our team';
    default:
      return 'This request was not approved';
  }
}

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const request = await getRequest(params.id);
  
  if (!request) {
    notFound();
  }
  
  const statusMessage = getStatusMessage(request.status);
  const statusIcon = request.status === 'approved' ? '✓' : request.status === 'pending' ? '⏳' : '✗';
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
          <Link 
            href="/newsletter" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-6 transition group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition" />
            Back to Community Wishlist
          </Link>
          
          {/* Request Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Request
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {request.title}
                  </h1>
                  <p className="text-gray-500 mt-2">
                    Category: {request.category_name || 'General'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 rounded-full">
                    <Heart size={16} className="text-red-500" />
                    <span className="font-semibold text-red-600">{request.like_count}</span>
                    <span className="text-xs text-red-500">votes</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="prose prose-sm max-w-none text-gray-600 mt-4">
                <p>{request.description}</p>
              </div>
            </div>
          </div>
          
          {/* Images Gallery */}
          {request.images.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Reference Images</h2>
                <p className="text-sm text-gray-500 mt-1">Visual inspiration for this request</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {request.images.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                      <Image
                        src={image.image_url}
                        alt="Request reference"
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Request Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Heart size={20} className="text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{request.like_count}</p>
                    <p className="text-xs text-gray-500">Total Votes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar size={20} className="text-gray-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatDate(request.created_at)}</p>
                    <p className="text-xs text-gray-500">Submitted On</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center">
                  {statusIcon} {statusMessage}
                </p>
              </div>
            </div>
          </div>
          
          {/* Share Section */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard');
              }}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 transition text-sm"
            >
              <Share2 size={16} />
              Share this request
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
