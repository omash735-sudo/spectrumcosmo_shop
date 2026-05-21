'use client';

import ProductCarouselBlock from './blocks/ProductCarouselBlock';
import StaticCardBlock from './blocks/StaticCardBlock';
import ImageTextBlock from './blocks/ImageTextBlock';
import AnnouncementBlock from './blocks/AnnouncementBlock';
import TrendingRequestsBlock from './blocks/TrendingRequestsBlock';
import InspirationGalleryBlock from './blocks/InspirationGalleryBlock';

interface ContentBlock {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
}

export default function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'product_carousel':
      return <ProductCarouselBlock block={block} />;
    case 'static_card':
      return <StaticCardBlock block={block} />;
    case 'image_text':
      return <ImageTextBlock block={block} />;
    case 'announcement':
      return <AnnouncementBlock block={block} />;
    case 'trending_requests':
      return <TrendingRequestsBlock block={block} />;
    case 'inspiration_gallery':
      return <InspirationGalleryBlock block={block} />;
    default:
      return null;
  }
}
