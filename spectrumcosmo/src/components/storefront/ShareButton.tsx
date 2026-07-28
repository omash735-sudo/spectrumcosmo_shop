// components/storefront/ShareButton.tsx
'use client';

import { Twitter, Facebook, Send, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  platform: 'twitter' | 'facebook' | 'whatsapp' | 'copy';
  url: string;
  title?: string;
  text?: string;
}

export default function ShareButton({ platform, url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || 'Check this out!')}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(text || `Check this out: ${url}`)}`;
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (platform) {
      case 'twitter': return <Twitter size={16} className="sm:w-[18px] sm:h-[18px]" />;
      case 'facebook': return <Facebook size={16} className="sm:w-[18px] sm:h-[18px]" />;
      case 'whatsapp': return <Send size={16} className="sm:w-[18px] sm:h-[18px]" />;
      case 'copy': return copied ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />;
    }
  };

  const getColors = () => {
    switch (platform) {
      case 'twitter': return 'bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white';
      case 'facebook': return 'bg-[#1877F2] hover:bg-[#1664d6] text-white';
      case 'whatsapp': return 'bg-[#25D366] hover:bg-[#1ebe5c] text-white';
      case 'copy': return 'bg-[var(--background-secondary)] hover:bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]';
    }
  };

  const getLabel = () => {
    switch (platform) {
      case 'twitter': return 'Twitter';
      case 'facebook': return 'Facebook';
      case 'whatsapp': return 'WhatsApp';
      case 'copy': return 'Copy Link';
    }
  };

  const handleClick = async () => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Failed to copy link');
      }
      return;
    }

    window.open(getShareUrl(), '_blank', 'width=600,height=400');
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${getColors()}`}
    >
      {getIcon()}
      <span className="hidden xs:inline">{getLabel()}</span>
    </button>
  );
}
