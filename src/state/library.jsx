import { createContext, useContext, useMemo } from 'react';
import { useStoredState } from '../hooks/useStoredState.js';

// "Obuna bo'lish" va "Yoqdi" — faqat shu brauzerda (localStorage) saqlanadi.
// Haqiqiy YouTube akkauntiga yozish OAuth 2.0 kirishni talab qiladi; oddiy API kalit bunga yetmaydi.
const LibraryContext = createContext(null);

const isText = (v) => typeof v === 'string' && v.length > 0 && v.length < 300;
const safeImage = (v) => (typeof v === 'string' && /^(https:\/\/|data:image\/)/.test(v) ? v : '');

function cleanSubscriptions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c) => c && isText(c.id) && isText(c.title))
    .map((c) => ({ id: c.id, title: c.title, avatar: safeImage(c.avatar) }));
}

function cleanLiked(value) {
  return Array.isArray(value) ? value.filter(isText) : [];
}

export function LibraryProvider({ children }) {
  const [storedSubscriptions, setSubscriptions] = useStoredState('tomosha.subscriptions', []);
  const [storedLiked, setLiked] = useStoredState('tomosha.liked', []);
  // localStorage'dagi ma'lumot buzilgan yoki qo'lda o'zgartirilgan bo'lsa ham ilova yiqilmasin.
  const subscriptions = useMemo(() => cleanSubscriptions(storedSubscriptions), [storedSubscriptions]);
  const liked = useMemo(() => cleanLiked(storedLiked), [storedLiked]);

  const value = useMemo(
    () => ({
      subscriptions,
      isSubscribed: (channelId) => subscriptions.some((c) => c.id === channelId),
      toggleSubscription: (channel) =>
        setSubscriptions((stored) => {
          const list = cleanSubscriptions(stored);
          return list.some((c) => c.id === channel.id)
            ? list.filter((c) => c.id !== channel.id)
            : [...list, { id: channel.id, title: channel.title, avatar: channel.avatar }];
        }),
      isLiked: (videoId) => liked.includes(videoId),
      toggleLike: (videoId) =>
        setLiked((stored) => {
          const list = cleanLiked(stored);
          return list.includes(videoId) ? list.filter((id) => id !== videoId) : [...list, videoId];
        }),
    }),
    [subscriptions, liked, setSubscriptions, setLiked],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary faqat <LibraryProvider> ichida ishlatiladi');
  return context;
}
