import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-500 text-white',
    warning: 'bg-yellow-500 text-dark-900',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={clsx(
        'rounded-lg px-4 py-3 shadow-lg',
        typeStyles[type]
      )}
    >
      {message}
    </motion.div>
  );
};

export default Toast;

