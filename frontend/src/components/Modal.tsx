import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed bg-black/50"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white rounded-2xl shadow-xl border border-slate-200 ${sizes[size]} w-full mx-4 max-h-[85vh] overflow-y-auto`}
              style={{
                position: 'relative',
                zIndex: 10000,
                pointerEvents: 'auto',
              }}
            >
            {title && (
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-2xl font-black text-gray-950">{title}</h2>
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
            {footer && (
              <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
};

export default Modal;

