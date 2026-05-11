'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface PopupSettings {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_link: string;
}

export default function HomepagePopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/homepage/popup')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.enabled) {
          const hasSeen = sessionStorage.getItem('popup_seen');
          if (!hasSeen) {
            setIsOpen(true);
            sessionStorage.setItem('popup_seen', 'true');
          }
        }
      });
  }, []);

  if (!isOpen || !settings?.enabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 z-10 p-1 bg-white/80 rounded-full hover:bg-white"
        >
          <X size={18} />
        </button>
        {settings.image_url && (
          <div className="relative h-48 w-full">
            <Image src={settings.image_url} alt="Popup" fill className="object-cover" />
          </div>
        )}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">{settings.title || 'Special Offer'}</h3>
          <p className="text-gray-600 mb-4">{settings.message || ''}</p>
          {settings.button_text && settings.button_link && (
            <a
              href={settings.button_link}
              className="inline-block bg-[#F97316] text-white px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition"
              onClick={() => setIsOpen(false)}
            >
              {settings.button_text}
            </a>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600 block w-full"
          >
            No, thanks
          </button>
        </div>
      </div>
    </div>
  );
}
