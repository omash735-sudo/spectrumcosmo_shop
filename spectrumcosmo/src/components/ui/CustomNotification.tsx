'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Truck, Package, Loader2 } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'delivery';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  delivery: Truck,
};

const colorMap = {
  success: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  error: 'border-red-500 bg-red-50 dark:bg-red-950/30',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
  delivery: 'border-[var(--primary)] bg-orange-50 dark:bg-orange-950/30',
};

const textColorMap = {
  success: 'text-emerald-800 dark:text-emerald-400',
  error: 'text-red-800 dark:text-red-400',
  info: 'text-blue-800 dark:text-blue-400',
  delivery: 'text-orange-800 dark:text-orange-400',
};

export function CustomNotification({ type, title, message, duration = 5000, onClose, action }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = iconMap[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-16 sm:top-20 right-3 sm:right-6 z-50 w-[calc(100%-24px)] sm:w-96 rounded-xl border shadow-lg ${colorMap[type]} animate-in slide-in-from-top-5 duration-300`}>
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Icon size={18} className={`${textColorMap[type]} flex-shrink-0 mt-0.5 sm:w-5 sm:h-5`} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm sm:text-base ${textColorMap[type]}`}>{title}</h3>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className={`mt-2 sm:mt-3 text-xs sm:text-sm font-medium ${textColorMap[type]} hover:underline transition`}
              >
                {action.label} →
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-[var(--background-secondary)]"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<(NotificationProps & { id: string })[]>([]);

  const showNotification = (notification: Omit<NotificationProps, 'onClose'>) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { ...notification, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.duration || 5000);
  };

  // Expose to window for global use
  useEffect(() => {
    (window as any).showNotification = showNotification;
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 space-y-2 sm:space-y-3 max-w-full sm:max-w-sm w-full">
        {notifications.map(notif => (
          <CustomNotification
            key={notif.id}
            {...notif}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}
      </div>
    </>
  );
}

// Hook to use notifications
export function useNotification() {
  const showNotification = (props: Omit<NotificationProps, 'onClose'>) => {
    if (typeof window !== 'undefined' && (window as any).showNotification) {
      (window as any).showNotification(props);
    } else {
      console.warn('Notification system not initialized. Make sure NotificationProvider is mounted.');
    }
  };
  return { showNotification };
}
