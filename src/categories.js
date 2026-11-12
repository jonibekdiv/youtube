import { t } from './i18n.js';

// YouTube'ning standart video kategoriyalari (videoCategoryId).
// `sidebar: true` — chap menyuda ham ko'rsatiladi; `icon` — Icon.jsx dagi nom.
export const CATEGORIES = [
  { id: '0', label: t.categories.all },
  { id: '10', label: t.categories.music, icon: 'music', sidebar: true },
  { id: '20', label: t.categories.gaming, icon: 'gaming', sidebar: true },
  { id: '17', label: t.categories.sports, icon: 'trophy', sidebar: true },
  { id: '25', label: t.categories.news, icon: 'news', sidebar: true },
  { id: '27', label: t.categories.education, icon: 'school', sidebar: true },
  { id: '28', label: t.categories.tech, icon: 'bulb', sidebar: true },
  { id: '1', label: t.categories.film, icon: 'movie', sidebar: true },
  { id: '19', label: t.categories.travel, icon: 'flight', sidebar: true },
  { id: '24', label: t.categories.entertainment },
  { id: '23', label: t.categories.comedy },
  { id: '26', label: t.categories.howto },
  { id: '2', label: t.categories.autos },
  { id: '15', label: t.categories.pets },
];

export const isKnownCategory = (id) => CATEGORIES.some((c) => c.id === id);
