// YouTube Data API v3 klienti.
//
// Kvota (kuniga 10 000 birlik) tejash uchun:
//  - videos / channels / playlistItems / commentThreads so'rovlari — 1 birlik,
//    search so'rovi esa 100 birlik. Shuning uchun bosh sahifa "mostPopular" (1 birlik) orqali,
//    kanal videolari esa "uploads" pleylisti (1 birlik) orqali olinadi; search faqat qidiruvda.
//  - Barcha javoblar 10 daqiqaga keshlanadi (xotira + sessionStorage), bir xil so'rovlar birlashtiriladi.
import { YouTubeApiError, classifyApiError } from './errors.js';
import { parseDuration } from '../utils/format.js';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const VIDEO_PARTS = 'snippet,contentDetails,statistics,status';
const CACHE_TTL = 10 * 60 * 1000;
const CACHE_PREFIX = 'tomosha.cache:';
const MAX_MEMORY_ENTRIES = 200;

const CARD_THUMBS = ['high', 'medium', 'standard', 'maxres', 'default'];
const AVATAR_THUMBS = ['default', 'medium', 'high'];
const LARGE_AVATAR_THUMBS = ['high', 'medium', 'default'];

function pickThumbnail(thumbnails = {}, order = CARD_THUMBS) {
  for (const name of order) {
    if (thumbnails[name]?.url) return thumbnails[name].url;
  }
  return '';
}

const toNumber = (value) => (value === undefined || value === null || value === '' ? null : Number(value));

function getSessionStorage() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null; // masalan, brauzer saqlashni bloklagan
  }
}

export function normalizeVideo(item) {
  const sn = item.snippet ?? {};
  const stats = item.statistics ?? {};
  return {
    id: typeof item.id === 'string' ? item.id : (item.id?.videoId ?? ''),
    title: sn.title ?? '',
    description: sn.description ?? '',
    thumbnail: pickThumbnail(sn.thumbnails),
    channelId: sn.channelId ?? '',
    channelTitle: sn.channelTitle ?? '',
    channelAvatar: '',
    publishedAt: sn.publishedAt ?? '',
    categoryId: sn.categoryId ?? '',
    duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : null,
    isLive: sn.liveBroadcastContent === 'live',
    views: toNumber(stats.viewCount),
    likes: toNumber(stats.likeCount),
    commentCount: toNumber(stats.commentCount),
    embeddable: item.status?.embeddable !== false,
  };
}

// YouTube banner rasmiga o'lcham/kesish parametrlarini qo'shamiz (aks holda juda past sifatli keladi).
const BANNER_SUFFIX = '=w1707-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj';

export function normalizeChannel(item) {
  const sn = item.snippet ?? {};
  const stats = item.statistics ?? {};
  const banner = item.brandingSettings?.image?.bannerExternalUrl;
  return {
    id: item.id ?? '',
    title: sn.title ?? '',
    handle: sn.customUrl ?? '',
    description: sn.description ?? '',
    avatar: pickThumbnail(sn.thumbnails, AVATAR_THUMBS),
    avatarLarge: pickThumbnail(sn.thumbnails, LARGE_AVATAR_THUMBS),
    banner: banner ? `${banner}${BANNER_SUFFIX}` : '',
    subscribers: stats.hiddenSubscriberCount ? null : toNumber(stats.subscriberCount),
    videoCount: toNumber(stats.videoCount),
  };
}

export function normalizeComment(comment = {}) {
  const sn = comment.snippet ?? {};
  return {
    id: comment.id ?? '',
    author: sn.authorDisplayName ?? '',
    authorAvatar: sn.authorProfileImageUrl ?? '',
    text: sn.textDisplay ?? '',
    likes: sn.likeCount ?? 0,
    publishedAt: sn.publishedAt ?? '',
  };
}

function normalizeThread(item) {
  return {
    ...normalizeComment(item.snippet?.topLevelComment),
    replyCount: item.snippet?.totalReplyCount ?? 0,
  };
}

const notFound = (reason, what) =>
  new YouTubeApiError(`${what} not found`, { kind: 'notFound', status: 404, reason });

function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

/**
 * @param {object} options
 * @param {string} options.apiKey            YouTube Data API kaliti
 * @param {string} [options.regionCode]      Trend videolar mamlakati (masalan "UZ")
 * @param {number} [options.pageSize]        Bir sahifadagi videolar soni
 * @param {Function} [options.fetchImpl]     fetch o'rniga (testlar uchun)
 * @param {Storage|null} [options.storage]   Kesh saqlanadigan joy (sessionStorage)
 * @param {Function} [options.now]           Hozirgi vaqt (testlar uchun)
 */
const FALLBACK_REGION = 'US';

export function createYouTubeClient({
  apiKey,
  regionCode = 'US',
  pageSize = 24,
  fetchImpl = (...args) => globalThis.fetch(...args),
  storage = getSessionStorage(),
  now = () => Date.now(),
} = {}) {
  const memory = new Map();
  const inflight = new Map();

  // ---------- kesh ----------

  function readCache(key) {
    const hit = memory.get(key);
    if (hit && now() - hit.time < CACHE_TTL) return hit.data;
    if (!storage) return undefined;
    try {
      const raw = storage.getItem(CACHE_PREFIX + key);
      if (!raw) return undefined;
      const entry = JSON.parse(raw);
      if (now() - entry.time >= CACHE_TTL) return undefined;
      memory.set(key, entry);
      return entry.data;
    } catch {
      return undefined; // buzilgan yozuv — oddiy kesh "yo'q"
    }
  }

  function clearStoredCache() {
    try {
      for (let i = storage.length - 1; i >= 0; i--) {
        const name = storage.key(i);
        if (name?.startsWith(CACHE_PREFIX)) storage.removeItem(name);
      }
    } catch {
      /* e'tiborsiz */
    }
  }

  function writeCache(key, data) {
    const entry = { time: now(), data };
    if (memory.size >= MAX_MEMORY_ENTRIES) memory.delete(memory.keys().next().value);
    memory.set(key, entry);
    if (!storage) return;
    try {
      storage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      clearStoredCache(); // joy yetmadi — eski keshni tozalaymiz, xotiradagi nusxa qoladi
    }
  }

  // ---------- so'rov ----------

  async function request(endpoint, params) {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(params).sort(([a], [b]) => a.localeCompare(b))) {
      if (value !== undefined && value !== null && value !== '') query.set(name, String(value));
    }
    // Kalit kesh kalitiga kirmaydi — sessionStorage'da saqlanib qolmasligi uchun.
    const cacheKey = `${endpoint}?${query}`;

    const cached = readCache(cacheKey);
    if (cached !== undefined) return cached;
    if (inflight.has(cacheKey)) return inflight.get(cacheKey);

    const task = (async () => {
      const url = new URL(`${BASE_URL}/${endpoint}`);
      url.search = query.toString();
      if (apiKey) url.searchParams.set('key', apiKey);

      let response;
      try {
        response = await fetchImpl(url);
      } catch (cause) {
        throw new YouTubeApiError(cause?.message ?? 'Network error', { kind: 'network' });
      }
      let body = null;
      try {
        body = await response.json();
      } catch {
        /* JSON emas */
      }
      if (!response.ok) throw classifyApiError(response.status, body);
      if (!body) throw new YouTubeApiError('Empty response', { status: response.status });
      writeCache(cacheKey, body);
      return body;
    })();

    inflight.set(cacheKey, task);
    try {
      return await task;
    } finally {
      inflight.delete(cacheKey);
    }
  }

  // ---------- yordamchilar ----------

  /** Videolarga kanal avatarlarini qo'shadi (bitta so'rov, 1 birlik). Bezak — xato bo'lsa e'tiborsiz. */
  async function attachAvatars(videos) {
    const ids = [...new Set(videos.map((v) => v.channelId).filter(Boolean))].slice(0, 50);
    if (!ids.length) return videos;
    try {
      const data = await request('channels', { part: 'snippet', id: ids.join(','), maxResults: 50 });
      const avatars = new Map(
        (data.items ?? []).map((c) => [c.id, pickThumbnail(c.snippet?.thumbnails, AVATAR_THUMBS)]),
      );
      for (const video of videos) video.channelAvatar = avatars.get(video.channelId) ?? '';
    } catch {
      /* avatarsiz ham ro'yxat ko'rsatilaveradi */
    }
    return videos;
  }

  /** Video ID lar → to'liq ma'lumotli videolar (davomiylik, ko'rishlar...), tartib saqlanadi. */
  async function hydrateVideos(ids) {
    if (!ids.length) return [];
    const data = await request('videos', {
      part: VIDEO_PARTS,
      id: ids.join(','),
      maxResults: Math.min(ids.length, 50),
    });
    const byId = new Map((data.items ?? []).map(normalizeVideo).map((v) => [v.id, v]));
    const ordered = ids.map((id) => byId.get(id)).filter((v) => v?.embeddable);
    return attachAvatars(ordered);
  }

  // ---------- ochiq metodlar ----------

  /** Mashhur (trend) videolar. Kategoriya bo'yicha ham filtrlash mumkin. 1 birlik. */
  // YouTube hamma mamlakatlarni qo'llamaydi (masalan UZ). Noto'g'ri bo'lsa bir marta US bilan qayta urinamiz.
  let region = regionCode;
  const isBadRegion = (error) =>
    error?.reason === 'invalidRegionCode' || /regionCode parameter specifies an invalid/i.test(error?.message ?? '');
  async function withRegion(fn) {
    try {
      return await fn(region);
    } catch (error) {
      if (!isBadRegion(error) || region === FALLBACK_REGION) throw error;
      region = FALLBACK_REGION;
      return fn(region);
    }
  }

  async function getPopularVideos({
    categoryId,
    pageToken,
    maxResults = pageSize,
    searchFallback = true,
  } = {}) {
    let data;
    try {
      data = await withRegion((regionCode) =>
        request('videos', {
          part: VIDEO_PARTS,
          chart: 'mostPopular',
          regionCode,
          videoCategoryId: categoryId,
          maxResults,
          pageToken,
        }),
      );
    } catch (error) {
      // Ba'zi kategoriyalar uchun mintaqada "mashhur" ro'yxati yo'q — qidiruvga o'tamiz (100 birlik).
      if (error.reason === 'videoChartNotFound' && categoryId && searchFallback) {
        return searchVideos({ categoryId, pageToken, maxResults });
      }
      throw error;
    }
    const items = (data.items ?? []).map(normalizeVideo).filter((v) => v.embeddable);
    await attachAvatars(items);
    return { items, nextPageToken: data.nextPageToken ?? null };
  }

  /** Qidiruv. Qimmat: 100 birlik (+ 2 ta arzon so'rov). Faqat boshqa saytlarda ijro etiladigan videolar. */
  async function searchVideos({ q, categoryId, pageToken, order, maxResults = 20 } = {}) {
    const data = await withRegion((regionCode) =>
      request('search', {
        part: 'snippet',
        type: 'video',
        videoEmbeddable: 'true',
        q,
        order,
        regionCode,
        videoCategoryId: categoryId,
        maxResults,
        pageToken,
      }),
    );
    const ids = (data.items ?? []).map((item) => item.id?.videoId).filter(Boolean);
    return { items: await hydrateVideos(ids), nextPageToken: data.nextPageToken ?? null };
  }

  async function getVideo(id) {
    const data = await request('videos', { part: VIDEO_PARTS, id });
    const item = data.items?.[0];
    if (!item) throw notFound('videoNotFound', 'Video');
    return normalizeVideo(item);
  }

  // Kanal ID: "UC" + 22 belgi. Noto'g'ri ID bilan API'ga so'rov yubormaymiz (kvota behuda ketmasin).
  const isValidChannelId = (id) => typeof id === 'string' && /^UC[\w-]{22}$/.test(id);

  async function getChannel(id) {
    if (!isValidChannelId(id)) throw notFound('channelNotFound', 'Channel');
    const data = await request('channels', { part: 'snippet,statistics,brandingSettings', id });
    const item = data.items?.[0];
    if (!item) throw notFound('channelNotFound', 'Channel');
    return normalizeChannel(item);
  }

  /** Kanalning yuklagan videolari ("uploads" pleylisti: UC… → UU…). 2 ta arzon so'rov. */
  async function getChannelVideos(channelId, { pageToken, maxResults = pageSize } = {}) {
    if (!isValidChannelId(channelId)) throw notFound('playlistNotFound', 'Channel');
    const data = await request('playlistItems', {
      part: 'contentDetails',
      playlistId: channelId.replace(/^UC/, 'UU'),
      maxResults,
      pageToken,
    });
    const ids = (data.items ?? []).map((item) => item.contentDetails?.videoId).filter(Boolean);
    return { items: await hydrateVideos(ids), nextPageToken: data.nextPageToken ?? null };
  }

  /** Izohlar. Izohlar o'chirilgan bo'lsa kind: 'commentsDisabled' xatosi qaytadi. */
  async function getComments(videoId, { pageToken, order = 'relevance', maxResults = 20 } = {}) {
    const data = await request('commentThreads', {
      part: 'snippet',
      videoId,
      order,
      maxResults,
      pageToken,
      textFormat: 'plainText',
    });
    return { items: (data.items ?? []).map(normalizeThread), nextPageToken: data.nextPageToken ?? null };
  }

  async function getReplies(parentId) {
    const data = await request('comments', {
      part: 'snippet',
      parentId,
      maxResults: 50,
      textFormat: 'plainText',
    });
    return { items: (data.items ?? []).map(normalizeComment) };
  }

  /**
   * "Tavsiya etilgan" videolar. YouTube'ning relatedToVideoId parametri 2023 da o'chirilgan,
   * shuning uchun arzon variant: shu kanalning oxirgi videolari + shu kategoriyadagi mashhurlari.
   */
  async function getRelatedVideos(video, { limit = 20 } = {}) {
    const results = await Promise.allSettled([
      getChannelVideos(video.channelId, { maxResults: 12 }),
      getPopularVideos({ categoryId: video.categoryId, maxResults: 24, searchFallback: false }),
    ]);
    const lists = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.items);
    if (!lists.length) throw results[0].reason;

    // Avval joriy video va takrorlarni olib tashlaymiz, keyin navbatlashtiramiz (aks holda tartib buziladi).
    const seen = new Set([video.id]);
    const unique = (list) => list.filter((v) => !seen.has(v.id) && seen.add(v.id));
    const [first = [], second = []] = lists.map(unique);
    return interleave(first, second).slice(0, limit);
  }

  return {
    getPopularVideos,
    searchVideos,
    getVideo,
    getChannel,
    getChannelVideos,
    getComments,
    getReplies,
    getRelatedVideos,
  };
}
