'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function ProductCarouselBlock({ block }: { block: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const productIds = block.content?.product_ids || [];
      if (productIds.length === 0) {
        const res = await fetch('/api/products?limit=6');
        const data = await res.json();
        setProducts(data);
      } else {
        const res = await fetch(`/api/products?ids=${productIds.join(',')}`);
        const data = await res.json();
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [block]);

  if (loading) return <div className="py-10 text-center">Loading products...</div>;
  if (products.length === 0) return null;

  return (
    <div className="my-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{block.title}</h2>
        {block.description && <p className="text-gray-500 mt-1">{block.description}</p>}
      </div>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        pagination={{ clickable: true }}
        navigation
        autoplay={block.content?.autoplay !== false ? { delay: 5000, disableOnInteraction: false } : false}
        className="pb-12"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <Link href={`/products/${product.id}`} className="block bg-white rounded-xl border overflow-hidden hover:shadow-md transition">
              <div className="relative h-48 bg-gray-100">
                <Image src={product.image_url || '/placeholder.jpg'} alt={product.name} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <div className="mt-2 text-[#F97316] font-bold">
                  <CurrencyPrice amountUsd={product.price} />
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
