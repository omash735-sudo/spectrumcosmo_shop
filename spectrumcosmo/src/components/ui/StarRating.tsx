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
    <div className="flex items-center gap-0.5 sm:gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className={`focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 rounded-sm transition-all ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          }`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={`${
              star <= displayRating
                ? 'text-[var(--primary)] fill-[var(--primary)]'
                : 'text-[var(--border)] fill-[var(--border)]'
            } transition-colors duration-150`}
          />
        </button>
      ))}
    </div>
  );
}
