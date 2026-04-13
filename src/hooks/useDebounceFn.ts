import { useEffect, useRef } from "react";

export const useDebounceFn = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 300
) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (...args: Args) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => fn(...args), delay);
  };
};
