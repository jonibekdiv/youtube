import { useEffect, useRef } from 'react';

/**
 * Ekranga yaqinlashganda `onVisible` ni chaqiradi (cheksiz aylantirish uchun).
 * `version` o'zgarganda kuzatuvchi qayta yaratiladi — shunda yangi sahifa ekranni to'ldirmagan bo'lsa,
 * keyingisi avtomatik yuklanadi.
 */
export default function Sentinel({ onVisible, disabled, version }) {
  const ref = useRef(null);
  const callback = useRef(onVisible);
  callback.current = onVisible;

  useEffect(() => {
    if (disabled || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [disabled, version]);

  return <div ref={ref} className="sentinel" aria-hidden="true" />;
}
