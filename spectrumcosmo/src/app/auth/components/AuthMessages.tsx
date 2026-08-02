import { motion, AnimatePresence } from 'framer-motion';

interface AuthMessagesProps {
  error: string;
  success: string;
  onClear: () => void;
  isDark: boolean;
}

export default function AuthMessages({ error, success, onClear, isDark }: AuthMessagesProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`text-sm rounded-xl px-4 py-3 mb-4 ${
            isDark
              ? 'bg-red-900/30 border border-red-800 text-red-400'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
          onClick={onClear}
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`text-sm rounded-xl px-4 py-3 mb-4 ${
            isDark
              ? 'bg-green-900/30 border border-green-800 text-green-400'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}
          onClick={onClear}
        >
          {success}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
