'use client';

import { Bell, Tag, Zap, Star } from 'lucide-react';

const iconMap = {
  Bell: Bell,
  Tag: Tag,
  Zap: Zap,
  Star: Star,
};

export default function AnnouncementBlock({ block }: { block: any }) {
  const { badge_text, icon } = block.content || {};
  const IconComponent = icon ? iconMap[icon as keyof typeof iconMap] : Bell;

  return (
    <div className="my-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-md">
      <div className="flex items-center gap-3">
        <IconComponent size={28} />
        <div>
          {badge_text && <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">{badge_text}</span>}
          <h3 className="text-xl font-bold mt-1">{block.title}</h3>
          {block.description && <p className="text-white/90 mt-1">{block.description}</p>}
        </div>
      </div>
    </div>
  );
}
