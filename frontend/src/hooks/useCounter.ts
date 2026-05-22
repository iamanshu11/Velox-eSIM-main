import { useState, useEffect, useRef } from 'react';

interface UseCounterOptions {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function useCounter({ target, duration = 2000, prefix = '', suffix = '' }: UseCounterOptions) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const refElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentElement = refElement.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * target);
      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVisible, target, duration]);

  return { count: `${prefix}${count.toLocaleString()}${suffix}`, ref: refElement };
}
