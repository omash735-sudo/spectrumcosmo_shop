'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: number;
}

export default function StarRating({
  rating,
  interactive = false,
  onRate,
  size = 20,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  const handleMouseEnter = (star: number) => {
    if (interactive) setHoverRating(star);
  };

  const handleMouseLeave = () => {
    if (interactive) setHoverRating(0);
  };

  const handleClick = (star: number) => {
    if (interactive && onRate) onRate(star);
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className={`focus:outline-none transition-transform ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          }`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={`${
              star <= displayRating
                ? 'text-[#F97316] fill-[#F97316]'
                : 'text-gray-300 fill-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}
