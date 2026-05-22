'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Section3DProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section3D({ children, className = '', id }: Section3DProps) {
  return (
    <motion.div
      id={id}
      className={`relative perspective ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{ perspective: '1200px' }}
    >
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
        }}
        whileInView={{
          rotateX: 0,
          rotateY: 0,
          z: 0,
        }}
        initial={{
          rotateX: 5,
          rotateY: -5,
          z: -50,
        }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Card3D({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{
        rotateX: -5,
        rotateY: 5,
        rotateZ: 1,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {children}
      <motion.div
        className="absolute inset-0 bg-linear-to-br from-gray-400/20 to-gray-500/20 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translateZ(20px)',
        }}
      />
    </motion.div>
  );
}

export function Float3D({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      animate={{
        y: [0, -15, 0],
        rotateZ: [0, 2, 0],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
}

export function GlassEffect({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative backdrop-blur-md bg-white/10 border border-white/20 ${className}`}
      whileHover={{
        borderColor: 'rgba(168, 85, 247, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
