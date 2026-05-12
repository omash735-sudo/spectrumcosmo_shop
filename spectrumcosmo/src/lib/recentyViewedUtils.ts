'use client';

export interface LastViewedCategory {
  category: string;
  timestamp: number;
  page: number;
}

export function saveLastCategory(category: string, page: number = 1) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    'spectrumcosmo_last_category',
    JSON.stringify({
      category,
      timestamp: Date.now(),
      page,
    })
  );
}

export function getLastCategory(): LastViewedCategory | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('spectrumcosmo_last_category');
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    // Only keep for 7 days
    if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('spectrumcosmo_last_category');
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearLastCategory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('spectrumcosmo_last_category');
}
