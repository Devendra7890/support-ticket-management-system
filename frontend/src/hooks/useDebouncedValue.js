import { useEffect, useState } from 'react';

/**
 * Returns a value that updates only after `delayMs` of stability.
 */
const useDebouncedValue = (value, delayMs = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
};

export default useDebouncedValue;
