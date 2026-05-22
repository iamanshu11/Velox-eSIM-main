import { useEffect, useState } from 'react';

interface UseDebounceOptions {
  delay?: number;
}

export const useDebounce = <T>(value: T, options: UseDebounceOptions = {}): T => {
  const { delay = 500 } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
