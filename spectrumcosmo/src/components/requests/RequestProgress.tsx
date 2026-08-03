import { CheckCircle, Circle, Clock } from 'lucide-react';

interface RequestProgressProps {
  status: string;
}

const STATUSES = ['pending', 'reviewing', 'approved', 'sourcing', 'available'];

const statusLabels = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  approved: 'Approved',
  sourcing: 'Sourcing',
  available: 'Available',
};

export default function RequestProgress({ status }: RequestProgressProps) {
  const currentIndex = STATUSES.indexOf(status);
  
  if (currentIndex === -1) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STATUSES.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step} className="flex-1 flex items-center">
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    </div>
                  ) : (
                    <Circle size={20} className="text-[var(--border)]" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 text-center whitespace-nowrap ${
                  isCompleted ? 'text-green-600 dark:text-green-400' :
                  isCurrent ? 'text-[var(--foreground)] font-medium' :
                  'text-[var(--foreground-muted)]'
                }`}>
                  {statusLabels[step as keyof typeof statusLabels]}
                </span>
              </div>

              {/* Connector line */}
              {index < STATUSES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
