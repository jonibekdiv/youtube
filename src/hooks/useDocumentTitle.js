import { useEffect } from 'react';
import { APP_NAME } from '../config.js';

/** Brauzer sarlavhasini o'rnatadi: "Sarlavha - Tomosha". Sarlavhasiz — faqat ilova nomi. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - ${APP_NAME}` : APP_NAME;
  }, [title]);
}
