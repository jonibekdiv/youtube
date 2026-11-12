import test from 'node:test';
import assert from 'node:assert/strict';
import { createYouTubeClient } from './youtube.js';
import { YouTubeApiError } from './errors.js';

// ---------- yordamchilar: Google javoblari shaklidagi soxta ma'lumotlar ----------

const thumbs = (base) => ({
  default: { url: `${base}/default.jpg`, width: 120, height: 90 },
  medium: { url: `${base}/medium.jpg`, width: 320, height: 180 },
  high: { url: `${base}/high.jpg`, width: 480, height: 360 },
});

const videoItem = (id, overrides = {}) => ({
  kind: 'youtube#video',
  id,
  snippet: {
    publishedAt: '2026-01-02T03:04:05Z',
    channelId: overrides.channelId ?? 'UCchannel000000000000001',
    title: `Video ${id}`,
    description: `Tavsif ${id}`,
    thumbnails: thumbs(`https://i.ytimg.com/vi/${id}`),
    channelTitle: 'Kanal',
    categoryId: overrides.categoryId ?? '10',
    liveBroadcastContent: overrides.live ? 'live' : 'none',
  },
  contentDetails: { duration: overrides.duration ?? 'PT3M33S' },
  status: { embeddable: overrides.embeddable ?? true },
  statistics: { viewCount: '1500000', likeCount: '42000', commentCount: '321', ...overrides.statistics },
});

const channelItem = (id, overrides = {}) => ({
  id,
  snippet: { title: `Kanal ${id}`, customUrl: '@kanal', description: 'Tavsif', thumbnails: thumbs(`https://yt3.ggpht.com/${id}`) },
  statistics: { subscriberCount: '12345', videoCount: '67', hiddenSubscriberCount: false, ...overrides.statistics },
  brandingSettings: { image: { bannerExternalUrl: 'https://yt3.googleusercontent.com/banner' } },
});

const apiError = (status, reason, message = 'Xato', extra = {}) => ({
  status,
  body: { error: { code: status, message, errors: [{ reason, message }], ...extra } },
});

/** endpoint nomi bo'yicha javob qaytaradigan soxta fetch; barcha chaqiruvlarni yozib boradi. */
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url) => {
    const u = new URL(url);
    const endpoint = u.pathname.split('/').pop();
    calls.push({ endpoint, params: Object.fromEntries(u.searchParams) });
    const route = routes[endpoint];
    if (!route) throw new Error(`Kutilmagan endpoint: ${endpoint}`);
    const { status = 200, body } = await route(u.searchParams);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  fn.calls = calls;
  return fn;
}

const channelsRoute = (searchParams) => ({
  body: { items: searchParams.get('id').split(',').map((id) => channelItem(id)) },
});

const makeClient = (routes, options = {}) => {
  const fetchImpl = fakeFetch(routes);
  const client = createYouTubeClient({ apiKey: 'SECRET-KEY', regionCode: 'UZ', fetchImpl, storage: null, ...options });
  return { client, fetchImpl };
};

// ---------- testlar ----------

test('getPopularVideos: to\'g\'ri so\'rov yuboradi, ma\'lumotni normallashtiradi, avatar qo\'shadi', async () => {
  const { client, fetchImpl } = makeClient({
    videos: () => ({
      body: {
        items: [videoItem('aaaaaaaaaaa'), videoItem('bbbbbbbbbbb', { embeddable: false }), videoItem('ccccccccccc', { live: true, duration: 'P0D' })],
        nextPageToken: 'NEXT',
      },
    }),
    channels: channelsRoute,
  });

  const page = await client.getPopularVideos({ categoryId: '10' });

  const call = fetchImpl.calls[0];
  assert.equal(call.endpoint, 'videos');
  assert.equal(call.params.chart, 'mostPopular');
  assert.equal(call.params.regionCode, 'UZ');
  assert.equal(call.params.videoCategoryId, '10');
  assert.equal(call.params.key, 'SECRET-KEY');
  assert.match(call.params.part, /snippet.*contentDetails.*statistics/);

  assert.equal(page.nextPageToken, 'NEXT');
  assert.deepEqual(page.items.map((v) => v.id), ['aaaaaaaaaaa', 'ccccccccccc'], 'embed qilib bo\'lmaydigan video chiqarib tashlanadi');

  const [first, live] = page.items;
  assert.equal(first.title, 'Video aaaaaaaaaaa');
  assert.equal(first.views, 1_500_000);
  assert.equal(first.likes, 42_000);
  assert.equal(first.duration, 213);
  assert.equal(first.thumbnail, 'https://i.ytimg.com/vi/aaaaaaaaaaa/high.jpg');
  assert.equal(first.channelAvatar, 'https://yt3.ggpht.com/UCchannel000000000000001/default.jpg');
  assert.equal(live.isLive, true);
  assert.equal(live.duration, 0);
});

test("getPopularVideos: kategoriya bo'sh bo'lsa chart parametri yuborilmaydi", async () => {
  const { client, fetchImpl } = makeClient({ videos: () => ({ body: { items: [] } }), channels: channelsRoute });
  const page = await client.getPopularVideos();
  assert.equal('videoCategoryId' in fetchImpl.calls[0].params, false);
  assert.deepEqual(page, { items: [], nextPageToken: null });
});

test("getPopularVideos: kategoriya uchun chart yo'q bo'lsa qidiruvga o'tadi", async () => {
  const { client, fetchImpl } = makeClient({
    videos: (p) =>
      p.get('chart') ? apiError(404, 'videoChartNotFound', 'Chart not found') : { body: { items: [videoItem('aaaaaaaaaaa')] } },
    search: () => ({ body: { items: [{ id: { kind: 'youtube#video', videoId: 'aaaaaaaaaaa' } }], nextPageToken: 'S2' } }),
    channels: channelsRoute,
  });

  const page = await client.getPopularVideos({ categoryId: '25' });

  assert.deepEqual(fetchImpl.calls.map((c) => c.endpoint), ['videos', 'search', 'videos', 'channels']);
  assert.equal(fetchImpl.calls[1].params.videoCategoryId, '25');
  assert.equal(page.items.length, 1);
  assert.equal(page.nextPageToken, 'S2');
});

test("noto'g'ri mintaqa (UZ): bir marta US bilan qayta so'raydi va keyin US ishlatadi", async () => {
  // YouTube'ning haqiqiy javobi: reason "invalidRegionCode" bo'lmasa ham xabar bo'yicha aniqlanadi
  const { client, fetchImpl } = makeClient({
    videos: (p) =>
      p.get('regionCode') === 'UZ'
        ? apiError(400, 'invalidParameter', 'The <code>regionCode</code> parameter specifies an invalid region code.')
        : { body: { items: [videoItem('aaaaaaaaaaa')] } },
    search: (p) =>
      p.get('regionCode') === 'UZ' ? apiError(400, 'invalidRegionCode', 'bad') : { body: { items: [] } },
    channels: channelsRoute,
  });

  const page = await client.getPopularVideos();
  assert.deepEqual(page.items.map((v) => v.id), ['aaaaaaaaaaa']);
  assert.deepEqual(fetchImpl.calls.slice(0, 2).map((c) => c.params.regionCode), ['UZ', 'US']);

  await client.searchVideos({ q: 'palov' });
  const searches = fetchImpl.calls.filter((c) => c.endpoint === 'search');
  assert.deepEqual(searches.map((c) => c.params.regionCode), ['US'], "keyingi so'rovlar to'g'ridan-to'g'ri US bilan");
});

test('getPopularVideos: searchFallback=false bo\'lsa xato qaytadi', async () => {
  const { client } = makeClient({ videos: () => apiError(404, 'videoChartNotFound') });
  await assert.rejects(
    client.getPopularVideos({ categoryId: '25', searchFallback: false }),
    (e) => e instanceof YouTubeApiError && e.reason === 'videoChartNotFound' && e.kind === 'notFound',
  );
});

test('searchVideos: search → videos ketma-ketligi, tartib saqlanadi', async () => {
  const { client, fetchImpl } = makeClient({
    search: () => ({
      body: {
        items: [
          { id: { videoId: 'bbbbbbbbbbb' } },
          { id: { videoId: 'aaaaaaaaaaa' } },
          { id: { kind: 'youtube#channel', channelId: 'UCxxxxxxxxxxxxxxxxxxxxxx' } }, // videoId yo'q — e'tiborsiz
        ],
        nextPageToken: 'P2',
      },
    }),
    // videos.list tartibni o'zgartirib qaytarishi mumkin
    videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa'), videoItem('bbbbbbbbbbb')] } }),
    channels: channelsRoute,
  });

  const page = await client.searchVideos({ q: "o'zbek palov" });

  assert.equal(fetchImpl.calls[0].endpoint, 'search');
  assert.equal(fetchImpl.calls[0].params.q, "o'zbek palov");
  assert.equal(fetchImpl.calls[0].params.type, 'video');
  assert.equal(fetchImpl.calls[0].params.videoEmbeddable, 'true');
  assert.equal(fetchImpl.calls[1].params.id, 'bbbbbbbbbbb,aaaaaaaaaaa');
  assert.deepEqual(page.items.map((v) => v.id), ['bbbbbbbbbbb', 'aaaaaaaaaaa']);
  assert.equal(page.nextPageToken, 'P2');
});

test("searchVideos: natija bo'lmasa videos so'rovi yuborilmaydi", async () => {
  const { client, fetchImpl } = makeClient({ search: () => ({ body: { items: [] } }) });
  const page = await client.searchVideos({ q: 'hech narsa' });
  assert.deepEqual(page, { items: [], nextPageToken: null });
  assert.equal(fetchImpl.calls.length, 1);
});

test("keshlash: bir xil so'rov bir marta yuboriladi; parallel so'rovlar birlashtiriladi", async () => {
  const { client, fetchImpl } = makeClient({ videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa')] } }) });

  const [a, b] = await Promise.all([client.getVideo('aaaaaaaaaaa'), client.getVideo('aaaaaaaaaaa')]);
  await client.getVideo('aaaaaaaaaaa');

  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(a.id, b.id);
});

test('keshlash: TTL tugagach qayta so\'raydi', async () => {
  let time = 1_000_000;
  const { client, fetchImpl } = makeClient(
    { videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa')] } }) },
    { now: () => time },
  );
  await client.getVideo('aaaaaaaaaaa');
  time += 9 * 60_000;
  await client.getVideo('aaaaaaaaaaa');
  assert.equal(fetchImpl.calls.length, 1);
  time += 2 * 60_000;
  await client.getVideo('aaaaaaaaaaa');
  assert.equal(fetchImpl.calls.length, 2);
});

test('keshlash: xatolar keshlanmaydi', async () => {
  let fail = true;
  const { client, fetchImpl } = makeClient({
    videos: () => (fail ? apiError(500, 'backendError') : { body: { items: [videoItem('aaaaaaaaaaa')] } }),
  });
  await assert.rejects(client.getVideo('aaaaaaaaaaa'));
  fail = false;
  assert.equal((await client.getVideo('aaaaaaaaaaa')).id, 'aaaaaaaaaaa');
  assert.equal(fetchImpl.calls.length, 2);
});

test('sessionStorage keshi: yoziladi, o\'qiladi, API kalit saqlanmaydi', async () => {
  const store = new Map();
  const storage = {
    get length() { return store.size; },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  const routes = { videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa')] } }) };

  const first = makeClient(routes, { storage });
  await first.client.getVideo('aaaaaaaaaaa');
  assert.equal(first.fetchImpl.calls.length, 1);
  assert.ok(store.size > 0);
  for (const [key, value] of store) {
    assert.ok(!key.includes('SECRET-KEY') && !value.includes('SECRET-KEY'), 'kalit keshga tushmasligi kerak');
  }

  // "sahifa qayta yuklandi": yangi klient, o'sha storage
  const second = makeClient(routes, { storage });
  await second.client.getVideo('aaaaaaaaaaa');
  assert.equal(second.fetchImpl.calls.length, 0);
});

test('sessionStorage to\'lib ketsa ham ishlaydi', async () => {
  const storage = {
    length: 0,
    key: () => null,
    getItem: () => null,
    setItem: () => { throw new DOMException('full', 'QuotaExceededError'); },
    removeItem: () => {},
  };
  const { client } = makeClient({ videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa')] } }) }, { storage });
  assert.equal((await client.getVideo('aaaaaaaaaaa')).id, 'aaaaaaaaaaa');
});

test('xatolarni tasniflash', async () => {
  const cases = [
    [apiError(403, 'quotaExceeded', 'You have exceeded your <a href="/x">quota</a>.'), 'quota'],
    [apiError(403, 'dailyLimitExceeded'), 'quota'],
    [apiError(400, 'badRequest', 'API key not valid. Please pass a valid API key.', { details: [{ reason: 'API_KEY_INVALID' }] }), 'key'],
    [apiError(403, 'forbidden', 'The request is missing a valid API key.'), 'key'],
    [apiError(403, 'forbidden', 'Requests from referer http://localhost:5173/ are blocked.', { details: [{ reason: 'API_KEY_HTTP_REFERRER_BLOCKED' }] }), 'referrer'],
    [apiError(403, 'accessNotConfigured', 'YouTube Data API v3 has not been used in project 1 before or it is disabled.'), 'notEnabled'],
    [apiError(403, 'commentsDisabled', 'The video identified by the videoId parameter has disabled comments.'), 'commentsDisabled'],
    [apiError(404, 'videoNotFound'), 'notFound'],
    [apiError(500, 'backendError'), 'unknown'],
  ];
  for (const [response, kind] of cases) {
    const { client } = makeClient({ videos: () => response });
    await assert.rejects(
      client.getVideo('aaaaaaaaaaa'),
      (e) => e instanceof YouTubeApiError && e.kind === kind && !/<[a-z]/i.test(e.message),
      `${response.body.error.errors[0].reason} → ${kind}`,
    );
  }
});

test('tarmoq xatosi kind: network', async () => {
  const client = createYouTubeClient({
    apiKey: 'k',
    storage: null,
    fetchImpl: async () => { throw new TypeError('Failed to fetch'); },
  });
  await assert.rejects(client.getVideo('aaaaaaaaaaa'), (e) => e.kind === 'network');
});

test("getVideo / getChannel: topilmasa notFound", async () => {
  const { client } = makeClient({ videos: () => ({ body: { items: [] } }), channels: () => ({ body: {} }) });
  await assert.rejects(client.getVideo('aaaaaaaaaaa'), (e) => e.kind === 'notFound' && e.reason === 'videoNotFound');
  await assert.rejects(client.getChannel('UCxxxxxxxxxxxxxxxxxxxxxx'), (e) => e.kind === 'notFound' && e.reason === 'channelNotFound');
});

test('getChannel: obunachilar yashirin bo\'lsa null', async () => {
  const { client } = makeClient({
    channels: () => ({ body: { items: [channelItem('UCxxxxxxxxxxxxxxxxxxxxxx', { statistics: { hiddenSubscriberCount: true, subscriberCount: '0' } })] } }),
  });
  const channel = await client.getChannel('UCxxxxxxxxxxxxxxxxxxxxxx');
  assert.equal(channel.subscribers, null);
  assert.equal(channel.videoCount, 67);
  assert.equal(channel.handle, '@kanal');
  assert.equal(channel.avatar, 'https://yt3.ggpht.com/UCxxxxxxxxxxxxxxxxxxxxxx/default.jpg');
  assert.equal(channel.avatarLarge, 'https://yt3.ggpht.com/UCxxxxxxxxxxxxxxxxxxxxxx/high.jpg');
  assert.match(channel.banner, /^https:\/\/yt3\.googleusercontent\.com\/banner=w\d+/);
});

test('getChannelVideos: uploads pleylisti (UC→UU), o\'chirilgan videolar tashlab ketiladi, tartib saqlanadi', async () => {
  const { client, fetchImpl } = makeClient({
    playlistItems: () => ({
      body: {
        items: [
          { contentDetails: { videoId: 'bbbbbbbbbbb' } },
          { contentDetails: { videoId: 'deletedvid1' } }, // videos.list qaytarmaydi
          { contentDetails: { videoId: 'aaaaaaaaaaa' } },
        ],
        nextPageToken: 'N',
      },
    }),
    videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa'), videoItem('bbbbbbbbbbb')] } }),
    channels: channelsRoute,
  });

  const page = await client.getChannelVideos('UCabcdefghijklmnopqrstuv');

  assert.equal(fetchImpl.calls[0].params.playlistId, 'UUabcdefghijklmnopqrstuv');
  assert.deepEqual(page.items.map((v) => v.id), ['bbbbbbbbbbb', 'aaaaaaaaaaa']);
  assert.equal(page.nextPageToken, 'N');
});

test('getComments / getReplies', async () => {
  const comment = (id, text) => ({
    id,
    snippet: { authorDisplayName: '@user', authorProfileImageUrl: 'https://a/p.jpg', textDisplay: text, likeCount: 7, publishedAt: '2026-01-01T00:00:00Z' },
  });
  const { client, fetchImpl } = makeClient({
    commentThreads: () => ({
      body: {
        items: [{ id: 'T1', snippet: { topLevelComment: comment('T1', 'Salom'), totalReplyCount: 2 } }],
        nextPageToken: 'C2',
      },
    }),
    comments: () => ({ body: { items: [comment('R1', 'Javob')] } }),
  });

  const threads = await client.getComments('aaaaaaaaaaa', { order: 'time' });
  assert.equal(fetchImpl.calls[0].params.textFormat, 'plainText');
  assert.equal(fetchImpl.calls[0].params.order, 'time');
  assert.deepEqual(threads.items[0], {
    id: 'T1', author: '@user', authorAvatar: 'https://a/p.jpg', text: 'Salom', likes: 7, publishedAt: '2026-01-01T00:00:00Z', replyCount: 2,
  });
  assert.equal(threads.nextPageToken, 'C2');

  const replies = await client.getReplies('T1');
  assert.equal(fetchImpl.calls[1].params.parentId, 'T1');
  assert.equal(replies.items[0].text, 'Javob');
});

test("izohlar o'chirilgan bo'lsa commentsDisabled", async () => {
  const { client } = makeClient({ commentThreads: () => apiError(403, 'commentsDisabled', 'disabled') });
  await assert.rejects(client.getComments('aaaaaaaaaaa'), (e) => e.kind === 'commentsDisabled');
});

test("getRelatedVideos: kanal va mashhurlarni aralashtiradi, joriy videoni va takrorlarni chiqarmaydi", async () => {
  const { client } = makeClient({
    playlistItems: () => ({ body: { items: ['cur00000001', 'ch000000001', 'ch000000002'].map((videoId) => ({ contentDetails: { videoId } })) } }),
    videos: (p) =>
      p.get('chart')
        ? { body: { items: ['pop00000001', 'ch000000001', 'pop00000002'].map((id) => videoItem(id)) } }
        : { body: { items: ['cur00000001', 'ch000000001', 'ch000000002'].map((id) => videoItem(id)) } },
    channels: channelsRoute,
  });

  const related = await client.getRelatedVideos({ id: 'cur00000001', channelId: 'UCchannel000000000000001', categoryId: '10' });

  assert.deepEqual(related.map((v) => v.id), ['ch000000001', 'pop00000001', 'ch000000002', 'pop00000002']);
});

test("getRelatedVideos: bitta manba ishlamasa ham natija qaytaradi; ikkalasi ham ishlamasa xato", async () => {
  const onlyChannel = makeClient({
    playlistItems: () => ({ body: { items: [{ contentDetails: { videoId: 'ch000000001' } }] } }),
    videos: (p) => (p.get('chart') ? apiError(404, 'videoChartNotFound') : { body: { items: [videoItem('ch000000001')] } }),
    channels: channelsRoute,
  });
  const related = await onlyChannel.client.getRelatedVideos({ id: 'cur00000001', channelId: 'UCcccccccccccccccccccccc', categoryId: '99' });
  assert.deepEqual(related.map((v) => v.id), ['ch000000001']);

  const none = makeClient({ playlistItems: () => apiError(500, 'backendError'), videos: () => apiError(500, 'backendError') });
  await assert.rejects(none.client.getRelatedVideos({ id: 'cur00000001', channelId: 'UCcccccccccccccccccccccc', categoryId: '10' }));
});

test("avatar so'rovi muvaffaqiyatsiz bo'lsa ham ro'yxat qaytadi", async () => {
  const { client } = makeClient({
    videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa')] } }),
    channels: () => apiError(403, 'quotaExceeded'),
  });
  const page = await client.getPopularVideos();
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].channelAvatar, '');
});

test("kalit bo'lmasa `key` parametri yuborilmaydi", async () => {
  const fetchImpl = fakeFetch({ videos: () => ({ body: { items: [videoItem('aaaaaaaaaaa')] } }) });
  const client = createYouTubeClient({ apiKey: '', fetchImpl, storage: null });
  await client.getVideo('aaaaaaaaaaa');
  assert.equal('key' in fetchImpl.calls[0].params, false);
});

test("noto'g'ri kanal ID: API'ga so'rov yuborilmaydi (kvota tejaladi)", async () => {
  const { client, fetchImpl } = makeClient({});
  for (const bad of ['bad', 'UCshort', '"><script>', 'UC' + 'a'.repeat(30)]) {
    await assert.rejects(client.getChannel(bad), (e) => e.kind === 'notFound');
    await assert.rejects(client.getChannelVideos(bad), (e) => e.kind === 'notFound');
  }
  assert.equal(fetchImpl.calls.length, 0);
});
