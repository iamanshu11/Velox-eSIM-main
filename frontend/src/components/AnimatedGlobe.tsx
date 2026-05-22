'use client';

import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

interface GlobePoint {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
}

const AnimatedGlobe: React.FC = () => {
  const [points, setPoints] = useState<GlobePoint[]>([]);
  const [connections, setConnections] = useState<Array<[number, number]>>([]);

  useEffect(() => {
    const newPoints: GlobePoint[] = Array.from({ length: 20 }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);

      return {
        id: i,
        x: (x + 1) / 2,
        y: (y + 1) / 2,
        radius: Math.random() * 2 + 1,
        color: ['#2563eb', '#06b6d4', '#0891b2'].at(Math.floor(Math.random() * 3)) || '#2563eb',
      };
    });

    setPoints(newPoints);

    const newConnections: Array<[number, number]> = [];
    newPoints.forEach((point, idx) => {
      newPoints.forEach((other, otherIdx) => {
        const distance = Math.sqrt((point.x - other.x) ** 2 + (point.y - other.y) ** 2);
        if (distance < 0.4 && idx < otherIdx && Math.random() > 0.5) {
          newConnections.push([idx, otherIdx]);
        }
      });
    });
    setConnections(newConnections);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(67, 161, 240, 0.16) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Container */}
      <svg className="w-full h-full max-w-md max-h-md absolute" viewBox="0 0 400 400">
        <defs>
          <radialGradient id="globeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background sphere */}
        <circle cx="200" cy="200" r="150" fill="url(#globeGradient)" stroke="#dbeafe" strokeWidth="1" opacity="0.3" />

        {/* Animated connection lines */}
        {connections.map((connection, idx) => {
          const p1 = points[connection[0]];
          const p2 = points[connection[1]];
          if (!p1 || !p2) return null;

          const x1 = 50 + p1.x * 300;
          const y1 = 50 + p1.y * 300;
          const x2 = 50 + p2.x * 300;
          const y2 = 50 + p2.y * 300;

          return (
            <motion.line
              key={`line-${idx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              opacity="0"
              animate={{
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + idx * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: idx * 0.1,
              }}
            />
          );
        })}

        {/* Animated points */}
        {points.map((point, idx) => (
          <g key={point.id}>
            {/* Point glow */}
            <motion.circle
              cx={50 + point.x * 300}
              cy={50 + point.y * 300}
              r={point.radius * 2}
              fill={point.color}
              opacity="0.2"
              animate={{
                r: [point.radius * 2, point.radius * 3.5, point.radius * 2],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: idx * 0.1,
              }}
            />

            {/* Point core */}
            <motion.circle
              cx={50 + point.x * 300}
              cy={50 + point.y * 300}
              r={point.radius}
              fill={point.color}
              filter="url(#glow)"
              animate={{
                opacity: [0.6, 1, 0.6],
                r: [point.radius, point.radius * 1.3, point.radius],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: idx * 0.15,
              }}
            />
          </g>
        ))}

        {/* Rotating orbit lines */}
        <motion.g
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            transformOrigin: '200px 200px',
          }}
        >
          <circle cx="200" cy="200" r="120" fill="none" stroke="#dbeafe" strokeWidth="1" opacity="0.2" strokeDasharray="5,5" />
          <circle cx="200" cy="200" r="100" fill="none" stroke="#cffafe" strokeWidth="1" opacity="0.1" strokeDasharray="5,5" />
        </motion.g>
      </svg>

      {/* Center accent */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-4 h-4 rounded-full bg-primary-700 shadow-lg shadow-primary-600/50" />
      </motion.div>
    </div>
  );
};

export default AnimatedGlobe;
