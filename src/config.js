// Barcha sozlamalar shu yerda. Qiymatlar .env faylidan olinadi (Vite: faqat VITE_ prefiksli o'zgaruvchilar).
const env = import.meta.env ?? {};

/** Ilova nomi (logotip va sahifa sarlavhasida). */
export const APP_NAME = 'RANGER TV';

const rawKey = (env.VITE_YOUTUBE_API_KEY ?? '').trim();
export const API_KEY = rawKey === 'YOUR_API_KEY' ? '' : rawKey;

/** Trend videolar mamlakati. */
export const REGION_CODE = (env.VITE_REGION_CODE || 'US').trim().toUpperCase();

/** Kalit bo'lmasa (yoki VITE_DEMO=true) ilova namunaviy ma'lumotlar bilan ishlaydi. */
export const DEMO_MODE = env.VITE_DEMO === 'true' || !API_KEY;

/** Bitta so'rovda nechta video yuklanadi (YouTube maksimum 50 ga ruxsat beradi). */
export const PAGE_SIZE = 24;
