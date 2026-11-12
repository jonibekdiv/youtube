import { useEffect, useRef, useState } from 'react';

const EMPTY = { key: null, data: null, error: null };

/**
 * Bitta asinxron natijani yuklaydi. `key` o'zgarsa qaytadan yuklanadi, `key === null` bo'lsa kutadi.
 * Natija qaysi `key` ga tegishli ekani saqlanadi — kalit almashganda eski ma'lumot bir lahza ham ko'rinmaydi.
 */
export function useAsync(key, fn) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(EMPTY);

  useEffect(() => {
    if (key === null) return undefined;
    let cancelled = false;
    fnRef.current().then(
      (data) => !cancelled && setState({ key, data, error: null }),
      (error) => !cancelled && setState({ key, data: null, error }),
    );
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const current = key !== null && state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: key !== null && !current,
    retry: () => {
      setState(EMPTY);
      setAttempt((n) => n + 1);
    },
  };
}
