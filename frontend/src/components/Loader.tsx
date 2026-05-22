import React from "react";
import { motion } from "framer-motion";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "pulse" | "bars";
  message?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  variant = "spinner",
  message = "Loading...",
  fullScreen = false,
}) => {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      {variant === "spinner" && (
        <svg
          className={`${sizeMap[size]} animate-spin text-primary-700`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {variant === "pulse" && (
        <motion.div
          className={`${sizeMap[size]} rounded-full bg-primary-700`}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {variant === "bars" && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-10 bg-primary-700 rounded-full"
              animate={{ scaleY: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      )}

      {message && (
        <motion.p
          className="text-sm text-gray-600 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
