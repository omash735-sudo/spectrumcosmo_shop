'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Truck, Package } from 'lucide-react';

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
  success: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
  info: 'border-blue-500 bg-blue-50',
  delivery: 'border-orange-500 bg-orange-50',
};

const textColorMap = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
  delivery: 'text-orange-800',
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
    <div className={`fixed top-20 right-6 z-50 w-96 rounded-xl border shadow-lg ${colorMap[type]} animate-in slide-in-from-top-5 duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon size={20} className={textColorMap[type]} />
          <div className="flex-1">
            <h3 className={`font-semibold ${textColorMap[type]}`}>{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className={`mt-3 text-sm font-medium ${textColorMap[type]} hover:underline`}
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
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
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
      <div className="fixed top-20 right-6 z-50 space-y-3">
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
    }
  };
  return { showNotification };
}
