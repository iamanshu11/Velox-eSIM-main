'use client';

import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from,
  to,
  duration = 2.5,
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const increment = (to - from) / (duration * 60);
    let currentValue = from;
    let frameId: NodeJS.Timeout;

    const animate = () => {
      currentValue += increment;
      if (currentValue >= to) {
        setDisplayValue(to);
      } else {
        setDisplayValue(Math.round(currentValue));
        frameId = setTimeout(animate, 1000 / 60);
      }
    };

    frameId = setTimeout(animate, 50);

    return () => clearTimeout(frameId);
  }, [from, to, duration]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
