'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FirstLaunchGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');

        // Only run on native app, not web browser
        if (!Capacitor.isNativePlatform()) return;

        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: 'hasLaunched' });

        if (!value) {
          await Preferences.set({ key: 'hasLaunched', value: 'true' });
          router.replace('/welcome');
        }
      } catch {
        // Not in Capacitor - skip
      }
    };
    checkFirstLaunch();
  }, [router]);

  return null;
}
