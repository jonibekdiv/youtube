import { useCallback, useEffect, useRef, useState } from 'react';

// stalled: oxirgi sahifa birorta ham yangi element qo'shmadi (lekin nextPageToken bor).
// Bunday holatda avtomatik yuklash to'xtatiladi — aks holda ekran to'lmagani uchun sahifalar
// to'xtovsiz so'ralib, API kvotasi bir zumda tugab qolishi mumkin.
const INITIAL = { key: null, items: [], nextToken: null, loading: true, loadingMore: false, error: null, stalled: false };

const mergeUnique = (previous, next) => {
  const seen = new Set(previous.map((item) => item.id));
  return [...previous, ...next.filter((item) => !seen.has(item.id))];
};

/**
 * Sahifalab yuklanadigan ro'yxat.
 *  - `key` o'zgarsa (masalan, boshqa kategoriya) ro'yxat noldan yuklanadi;
 *  - `fetchPage(pageToken)` → { items, nextPageToken };
 *  - eski so'rovlarning kechikib kelgan javoblari e'tiborsiz qoldiriladi (poyga holati yo'q).
 */
export function usePagedList(key, fetchPage) {
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const generation = useRef(0); // har bir qayta yuklashda oshadi — eski javoblarni aniqlash uchun
  const busy = useRef(false); // ikki marta parallel "yana yuklash" bo'lmasligi uchun
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(INITIAL);

  const run = useCallback(async (listKey, pageToken) => {
    const gen = generation.current;
    busy.current = true;
    setState((s) => ({ ...s, loading: !pageToken, loadingMore: Boolean(pageToken), error: null }));
    try {
      const { items, nextPageToken } = await fetchRef.current(pageToken);
      if (gen !== generation.current) return;
      setState((s) => {
        const previous = pageToken ? s.items : [];
        const merged = mergeUnique(previous, items);
        return {
          key: listKey,
          items: merged,
          nextToken: nextPageToken ?? null,
          loading: false,
          loadingMore: false,
          error: null,
          stalled: merged.length === previous.length,
        };
      });
    } catch (error) {
      if (gen !== generation.current) return;
      setState((s) => ({ ...s, key: listKey, loading: false, loadingMore: false, error }));
    } finally {
      if (gen === generation.current) busy.current = false;
    }
  }, []);

  useEffect(() => {
    generation.current += 1;
    busy.current = false;
    setState({ ...INITIAL, key });
    run(key, null);
    return () => {
      generation.current += 1;
    };
  }, [key, attempt, run]);

  // Kalit endigina o'zgargan bo'lsa (effekt hali ishlamagan) — eski ro'yxatni emas, yuklanishni ko'rsatamiz.
  const current = state.key === key ? state : INITIAL;
  const { nextToken, items } = current;

  const loadMore = useCallback(() => {
    if (nextToken && !busy.current) run(key, nextToken);
  }, [key, nextToken, run]);

  // Birinchi sahifa xato bergan bo'lsa — boshidan; keyingi sahifa xato bergan bo'lsa — o'sha sahifani qayta.
  const retry = useCallback(() => {
    if (items.length && nextToken) run(key, nextToken);
    else setAttempt((n) => n + 1);
  }, [items.length, key, nextToken, run]);

  return {
    items: current.items,
    loading: current.loading,
    loadingMore: current.loadingMore,
    error: current.error,
    stalled: current.stalled,
    hasMore: Boolean(nextToken),
    loadMore,
    retry,
  };
}
