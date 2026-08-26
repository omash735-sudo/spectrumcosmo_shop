'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function RequireAuth({ children, requireAdmin = false }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let token: string | null = null;
        const cookieName = requireAdmin ? 'admin_token' : 'user_token';
        
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(
            new RegExp(`(^| )${cookieName}=([^;]+)`)
          );
          token = cookieMatch ? cookieMatch[2] : null;
        }

        if (token) {
          setIsAuthenticated(true);
        } else {
          const loginPath = requireAdmin ? '/admin/login' : '/auth/login';
          router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        const loginPath = requireAdmin ? '/admin/login' : '/auth/login';
        router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, requireAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
