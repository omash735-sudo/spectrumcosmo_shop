'use client';

import { Twitter, Facebook, Share2, Copy } from 'lucide-react';

interface ShareButtonProps {
  platform: 'twitter' | 'facebook' | 'whatsapp' | 'copy';
  url: string;
  title?: string;
  text?: string;
}

export default function ShareButton({ platform, url, title, text }: ShareButtonProps) {
  const handleShare = () => {
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title || 'Check this out')}&url=${encodeURIComponent(url)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text || `Check out ${url}`)}`;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      return;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const Icon = platform === 'twitter' ? Twitter : platform === 'facebook' ? Facebook : platform === 'copy' ? Copy : Share2;

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
      aria-label={`Share on ${platform}`}
    >
      <Icon size={18} />
    </button>
  );
}
