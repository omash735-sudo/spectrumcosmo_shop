'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-full transition"
        aria-label="Search"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center gap-4 p-4 border-b">
            <form onSubmit={handleSubmit} className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full p-3 pr-10 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </form>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {query.length >= 2 && results.length === 0 && !loading && (
              <p className="text-center text-gray-500 mt-8">
                No products found. Try "hoodie" or "bracelet"
              </p>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((product) => (
                  <a
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 transition"
                  >
                    <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{product.name}</p>
                      <p className="text-sm text-[#F97316] font-semibold">${product.price}</p>
                    </div>
                  </a>
                ))}

                <button
                  onClick={handleSubmit}
                  className="w-full mt-4 p-3 bg-gray-100 rounded-xl text-center text-gray-700 hover:bg-gray-200 transition"
                >
                  See all results for "{query}" →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
      }
