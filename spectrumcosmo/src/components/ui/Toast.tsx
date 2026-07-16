// components/ui/Toast.tsx
'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (type === 'loading') return; // Don't auto-close loading toasts
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration, type]);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500 dark:bg-emerald-600',
          icon: <CheckCircle size={18} className="sm:w-5 sm:h-5" />,
          border: 'border-emerald-600 dark:border-emerald-700',
        };
      case 'error':
        return {
          bg: 'bg-red-500 dark:bg-red-600',
          icon: <XCircle size={18} className="sm:w-5 sm:h-5" />,
          border: 'border-red-600 dark:border-red-700',
        };
      case 'info':
        return {
          bg: 'bg-blue-500 dark:bg-blue-600',
          icon: <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">i</div>,
          border: 'border-blue-600 dark:border-blue-700',
        };
      case 'loading':
        return {
          bg: 'bg-[var(--primary)] dark:bg-[var(--primary)]',
          icon: <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin" />,
          border: 'border-[var(--primary-hover)]',
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 animate-slide-up">
      <div className={`flex items-center gap-2.5 sm:gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl shadow-xl border ${config.border} ${config.bg} text-white max-w-full sm:max-w-sm min-h-[52px]`}>
        {config.icon}
        <span className="text-sm sm:text-base font-medium">{message}</span>
        {type !== 'loading' && (
          <button
            onClick={onClose}
            className="ml-auto text-white/70 hover:text-white transition flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close notification"
          >
            <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}

// Toast container for multiple toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 flex flex-col gap-2 sm:gap-3 items-center sm:items-end max-w-full sm:max-w-sm">
      {children}
    </div>
  );
}

// Hook for easier usage
export function useToast() {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastProps['type'] }[]>([]);

  const showToast = (message: string, type: ToastProps['type'] = 'success', duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration || 3000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}

// Add useState import
import { useState } from 'react';
