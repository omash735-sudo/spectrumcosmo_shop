'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ImageTextBlock({ block }: { block: any }) {
  const { image_url, image_position, button_text, button_link, text_alignment } = block.content || {};
  const isImageLeft = image_position !== 'right';
  const alignClass = text_alignment === 'left' ? 'text-left' : text_alignment === 'right' ? 'text-right' : 'text-center';

  return (
    <div className="my-8 bg-white rounded-2xl border overflow-hidden shadow-sm">
      <div className={`grid md:grid-cols-2 ${isImageLeft ? '' : 'md:flex-row-reverse'}`}>
        <div className="relative h-64 md:h-auto">
          <Image src={image_url || '/placeholder.jpg'} alt={block.title} fill className="object-cover" />
        </div>
        <div className={`p-6 flex flex-col justify-center ${alignClass}`}>
          <h3 className="text-2xl font-bold text-gray-900">{block.title}</h3>
          {block.description && <p className="text-gray-600 mt-2">{block.description}</p>}
          {button_text && button_link && (
            <Link href={button_link} className={`inline-block mt-4 bg-[#F97316] text-white px-6 py-2 rounded-full hover:bg-orange-600 transition ${alignClass === 'text-center' ? 'mx-auto' : ''}`}>
              {button_text}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
