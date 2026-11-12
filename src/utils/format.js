import { t } from '../i18n.js';

/** ISO 8601 davomiylik ("PT1H2M3S", "P0D") → soniyalar. */
export function parseDuration(iso) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso ?? '');
  if (!m) return 0;
  const n = (x) => Number(x ?? 0);
  return n(m[1]) * 86400 + n(m[2]) * 3600 + n(m[3]) * 60 + n(m[4]);
}

/** 3723 → "1:02:03", 63 → "1:03". */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (x) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

const COMPACT_UNITS = [
  [1e9, t.units.billion],
  [1e6, t.units.million],
  [1e3, t.units.thousand],
];

/** 1234 → "1,2 ming", 15300000 → "15 mln" (YouTube kabi yaxlitlamasdan, qirqib). */
export function compactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const n = Math.max(0, Math.floor(value));
  for (const [size, unit] of COMPACT_UNITS) {
    if (n >= size) {
      // Butun sonlar bilan hisoblaymiz — suzuvchi nuqta xatolari chiqmasligi uchun.
      const tenths = Math.floor(n / (size / 10));
      const whole = Math.floor(tenths / 10);
      const frac = tenths % 10;
      const text = tenths >= 100 || frac === 0 ? String(whole) : `${whole},${frac}`;
      return `${text} ${unit}`;
    }
  }
  return String(n);
}

/** 1234567 → "1 234 567" (uzilmas bo'sh joy bilan). */
export function groupDigits(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return String(Math.floor(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const TIME_UNITS = [
  [365 * 86400, 'year'],
  [30 * 86400, 'month'],
  [7 * 86400, 'week'],
  [86400, 'day'],
  [3600, 'hour'],
  [60, 'minute'],
];

/** ISO sana → "3 kun oldin". */
export function timeAgo(iso, now = Date.now()) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  for (const [size, unit] of TIME_UNITS) {
    if (seconds >= size) return t.ago[unit](Math.floor(seconds / size));
  }
  return t.justNow;
}

/** ISO sana → "2025-yil 5-mart". */
export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-yil ${d.getDate()}-${t.months[d.getMonth()]}`;
}

const URL_RE = /https?:\/\/[^\s<>"']+/g;

/**
 * Matnni oddiy bo'laklar va havolalarga ajratadi, shunda React uni xavfsiz chizadi
 * (xom HTML kiritish kerak emas). Faqat http(s) havolalar tanib olinadi.
 */
export function splitLinks(text = '') {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const url = match[0].replace(/[.,;:!?)\]}]+$/, ''); // gap oxiridagi tinish belgilarini havoladan ajratamiz
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    parts.push({ type: 'link', value: url });
    last = match.index + url.length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

/** YouTube video ID: 11 ta belgi (harf, raqam, "_" va "-"). */
export const isValidVideoId = (id) => typeof id === 'string' && /^[\w-]{11}$/.test(id);
