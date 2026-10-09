import { useEffect, useRef, useState, useCallback } from 'react';

export function usePolling(
  fn: () => Promise<boolean>, // returns true to continue polling, false to stop
  intervalMs: number,
  enabled = true,
  maxAttempts = 60,
) {
  const [isPolling, setIsPolling] = useState(enabled);
  const attemptsRef = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const stop = useCallback(() => {
    setIsPolling(false);
  }, []);

  const start = useCallback(() => {
    attemptsRef.current = 0;
    setIsPolling(true);
  }, []);

  useEffect(() => {
    if (!enabled || !isPolling) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (!active) return;
      if (attemptsRef.current >= maxAttempts) {
        setIsPolling(false);
        return;
      }
      attemptsRef.current++;
      try {
        const shouldContinue = await fnRef.current();
        if (active && shouldContinue) {
          timer = setTimeout(tick, intervalMs);
        } else {
          setIsPolling(false);
        }
      } catch {
        if (active) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    };

    timer = setTimeout(tick, intervalMs);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, isPolling, intervalMs, maxAttempts]);

  return { isPolling, stop, start };
}
