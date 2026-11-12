import { useEffect, useState } from 'react';

/** useState + localStorage. Saqlash mavjud bo'lmasa (maxfiy rejim va h.k.) oddiy useState kabi ishlaydi. */
export function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      /* o'qib bo'lmadi — boshlang'ich qiymat ishlatiladi */
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* yozib bo'lmadi — holat faqat xotirada qoladi */
    }
  }, [key, value]);

  return [value, setValue];
}
