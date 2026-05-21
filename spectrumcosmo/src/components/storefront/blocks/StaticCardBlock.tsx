'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function StaticCardBlock({ block }: { block: any }) {
  const { image_url, button_text, button_link } = block.content || {};

  return (
    <div className="my-8 bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition">
      {image_url && (
        <div className="relative h-64 w-full">
          <Image src={image_url} alt={block.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">{block.title}</h3>
        {block.description && <p className="text-gray-600 mt-2">{block.description}</p>}
        {button_text && button_link && (
          <Link href={button_link} className="inline-block mt-4 bg-[#F97316] text-white px-6 py-2 rounded-full hover:bg-orange-600 transition">
            {button_text}
          </Link>
        )}
      </div>
    </div>
  );
}
