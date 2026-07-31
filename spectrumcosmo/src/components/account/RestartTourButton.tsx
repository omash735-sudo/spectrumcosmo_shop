'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestartTourButton() {
  const { restartTour } = useOnboarding();

  const handleRestart = async () => {
    await restartTour();
    toast.success('Tour restarted!');
  };

  return (
    <button
      onClick={handleRestart}
      className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition text-sm"
    >
      <HelpCircle size={16} />
      Restart Onboarding Tour
    </button>
  );
}
