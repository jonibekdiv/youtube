// Demo rejim: API kaliti bo'lmaganda ilovani ko'rish uchun NAMUNAVIY (soxta) ma'lumotlar.
// Funksiyalar youtube.js dagi bilan bir xil imzoga ega, shuning uchun UI farqni sezmaydi.
import { YouTubeApiError } from './errors.js';

const DAY = 86_400_000;
const DEMO_PAGE_SIZE = 12;

const channelId = (n) => `UCdemo${String(n).padStart(18, '0')}`;

const CHANNELS = [
  { title: 'Dasturchi TV', handle: '@dasturchitv', subscribers: 1_240_000, hue: 215, about: "Dasturlash, veb-texnologiyalar va sun'iy intellekt haqida o'zbek tilida darslar." },
  { title: 'Sayohat Olami', handle: '@sayohatolami', subscribers: 860_000, hue: 165, about: "O'zbekiston va dunyo bo'ylab sayohatlar, yo'l eslatmalari." },
  { title: 'Oshxona Sirlari', handle: '@oshxonasirlari', subscribers: 2_150_000, hue: 25, about: "Milliy va zamonaviy taomlar retseptlari." },
  { title: 'Sport Zone', handle: '@sportzone', subscribers: 540_000, hue: 125, about: 'Sport yangiliklari, tahlillar va mashqlar.' },
  { title: 'Musiqa Maskani', handle: '@musiqamaskani', subscribers: 3_400_000, hue: 305, about: "Eng yaxshi qo'shiqlar va jonli konsertlar." },
  { title: 'Yangiliklar 24', handle: '@yangiliklar24', subscribers: 1_020_000, hue: 355, about: 'Kunlik yangiliklar va tahliliy sharhlar.' },
  { title: "O'yin Olami", handle: '@oyinolami', subscribers: 720_000, hue: 270, about: "O'yinlar sharhi va o'tish qo'llanmalari." },
  { title: 'Ilm Dunyosi', handle: '@ilmdunyosi', subscribers: 990_000, hue: 190, about: 'Fan, texnika va tabiat haqida qiziqarli videolar.' },
  { title: 'Kulgi Maskani', handle: '@kulgimaskani', subscribers: 450_000, hue: 45, about: "Qiziqarli va kulgili lahzalar." },
  { title: "Kino Bog'i", handle: '@kinobogi', subscribers: 310_000, hue: 330, about: 'Qisqametrajli filmlar va kino sharhlari.' },
].map((channel, i) => ({ ...channel, id: channelId(i + 1) }));

// [kanal, kategoriya, sarlavha, davomiylik (soniya), ko'rishlar, necha kun oldin]
const RAW_VIDEOS = [
  [0, '27', "JavaScript asoslari: 1-dars — o'zgaruvchilar va ma'lumot turlari", 1694, 482_000, 12],
  [0, '28', "React 19 yangiliklari: nimalar o'zgardi?", 1120, 215_000, 5],
  [0, '27', "Python bilan 30 daqiqada birinchi dastur", 1865, 391_000, 33],
  [0, '28', "Sun'iy intellekt bilan ishlash: 10 ta foydali maslahat", 742, 1_130_000, 3],
  [1, '19', "Samarqand bo'ylab sayohat: Registon va Shohizinda", 1471, 2_310_000, 21],
  [1, '19', "Buxoro — 2500 yillik shahar", 1147, 1_480_000, 40],
  [1, '19', "Xiva: ichan qal'a sirlari", 1005, 905_000, 62],
  [1, '19', "Chimyon tog'lariga yurish", 672, 318_000, 8],
  [2, '26', 'Haqiqiy palov: qadam-baqadam retsept', 1370, 5_800_000, 18],
  [2, '26', 'Samsa pishirish sirlari', 858, 2_240_000, 27],
  [2, '26', "Uyda lag'mon tayyorlash", 1056, 1_760_000, 9],
  [2, '26', 'Mastava: oson va mazali', 581, 640_000, 55],
  [3, '17', 'Haftaning eng yaxshi gollari', 492, 3_900_000, 2],
  [3, '17', 'Boks: tarixiy jang tahlili', 1263, 745_000, 14],
  [3, '17', 'Uyda mashq: 20 daqiqalik kardio', 1200, 1_020_000, 30],
  [3, '17', "Kurash bo'yicha terma jamoa tayyorgarligi", 807, 288_000, 6],
  [4, '10', "Sevgi qo'shiqlari to'plami", 3510, 8_900_000, 16],
  [4, '10', 'Akustik konsert: jonli ijro', 2535, 1_950_000, 24],
  [4, '10', 'Dutor va doira: milliy ohanglar', 408, 560_000, 48],
  [4, '10', "Eng yaxshi 20 ta yangi qo'shiq", 3912, 4_300_000, 4],
  [5, '25', "Bugungi asosiy yangiliklar", 450, 905_000, 0],
  [5, '25', 'Iqtisodiyot haftaligi: raqamlar va tahlil', 944, 332_000, 7],
  [5, '25', "Ob-havo prognozi: kelgusi hafta", 201, 1_210_000, 1],
  [5, '25', 'Texnologiya yangiliklari: haftalik sharh', 669, 267_000, 10],
  [6, '20', "Eng yaxshi 10 ta mobil o'yin", 842, 1_640_000, 11],
  [6, '20', "Shaxmat: 5 ta tuzoq debyut", 764, 2_020_000, 35],
  [6, '20', "Qurilish o'yini: katta qal'a qurish", 1655, 590_000, 20],
  [6, '20', "Jonli efir: yangi o'yin sinovi", null, 74_000, 0],
  [7, '28', "Koinot qanday paydo bo'lgan?", 1518, 3_150_000, 45],
  [7, '27', 'Inson miyasi: qiziqarli faktlar', 980, 1_390_000, 19],
  [7, '27', 'Fizika: Nyuton qonunlari oddiy tilda', 1132, 702_000, 58],
  [7, '27', 'Kimyo: uyda xavfsiz tajribalar', 630, 1_810_000, 26],
  [8, '23', "Kulgili lahzalar to'plami", 555, 4_700_000, 13],
  [8, '15', 'Mushuklar va itlar: qiziqarli videolar', 400, 6_200_000, 22],
  [9, '1', "Qisqametrajli film: «Oxirgi bekat»", 1105, 480_000, 37],
  [9, '2', 'Yangi avtomobillar sharhi', 910, 1_090_000, 15],
];

const DESCRIPTION =
  "Bu namunaviy (demo) video — haqiqiy ma'lumotlar emas.\n\n" +
  "Haqiqiy videolarni ko'rish uchun .env faylida VITE_YOUTUBE_API_KEY ni sozlang.\n" +
  'Batafsil: https://developers.google.com/youtube/v3/getting-started\n\n' +
  "Bo'limlar:\n0:00 Kirish\n2:15 Asosiy qism\n8:40 Xulosa\n\n" +
  "Videoni yoqtirgan bo'lsangiz, obuna bo'ling va do'stlaringizga ulashing!";

function svgEscape(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

/** Har bir video uchun gradientli SVG "muqova" (tashqi rasm kerak emas). */
function makeThumbnail(hue, label) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 70% 46%)"/><stop offset="1" stop-color="hsl(${(hue + 55) % 360} 75% 28%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="640" height="360" fill="url(#g)"/>` +
    `<circle cx="320" cy="170" r="58" fill="#fff" fill-opacity=".2"/>` +
    `<path d="M302 138l56 32-56 32z" fill="#fff" fill-opacity=".92"/>` +
    `<text x="24" y="334" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#fff" fill-opacity=".85">${svgEscape(label)}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const VIDEOS = RAW_VIDEOS.map(([channelIndex, categoryId, title, duration, views, daysAgo], index) => {
  const channel = CHANNELS[channelIndex];
  return {
    id: `demo-vid-${String(index + 1).padStart(2, '0')}`,
    title,
    description: DESCRIPTION,
    thumbnail: makeThumbnail(channel.hue + (index % 4) * 14, channel.title),
    channelId: channel.id,
    channelTitle: channel.title,
    channelAvatar: '',
    publishedAt: new Date(Date.now() - daysAgo * DAY - 3_600_000).toISOString(),
    categoryId,
    duration,
    isLive: duration === null,
    views,
    likes: Math.round(views * 0.037),
    commentCount: 10,
    embeddable: true,
  };
});

const COMMENTS = [
  ['Aziza', "Juda foydali video bo'libdi, rahmat! Davomini kutamiz.", 128, 1, 2],
  ['Jasur_dev', "Menga eng yoqqani — hamma narsa sodda tilda tushuntirilgani.", 87, 0, 3],
  ['Malika', "Shuncha sifatli kontent bepul! Kanalingizga omad.", 64, 2, 5],
  ['Sardor', "5:30 dagi qism juda ham qiziq chiqibdi.", 41, 0, 9],
  ['Dilnoza', "Do'stlarimga ham yubordim, hammasiga yoqdi.", 33, 0, 11],
  ['Bobur', "Yana shunaqa mavzularda video chiqaring iltimos.", 21, 0, 14],
  ['Nodira', "Ajoyib montaj va ovoz sifati 👏", 18, 0, 20],
  ['Otabek', "Birinchi marta ko'rdim, obuna bo'ldim.", 9, 0, 31],
  ['Zilola', "Rahmat, juda tushunarli bo'libdi!", 6, 0, 45],
  ['Ravshan', "Qaysi dasturda tahrir qilingan?", 3, 0, 60],
].map(([author, text, likes, replyCount, daysAgo], i) => ({
  id: `demo-comment-${i + 1}`,
  author,
  authorAvatar: '',
  text,
  likes,
  replyCount,
  publishedAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
}));

const REPLIES = [
  ['Muallif', 'Rahmat! Tez orada yangi dars chiqadi.', 12, 1],
  ['Kamola', "Menga ham shu fikr yoqdi.", 3, 1],
].map(([author, text, likes, daysAgo], i) => ({
  id: `demo-reply-${i + 1}`,
  author,
  authorAvatar: '',
  text,
  likes,
  publishedAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
}));

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (text) => text.toLowerCase().replace(/['’ʻʼ‘`]/g, '');

function paginate(list, pageToken, size = DEMO_PAGE_SIZE) {
  const start = Number(pageToken) || 0;
  const end = start + size;
  return {
    items: list.slice(start, end).map((item) => ({ ...item })),
    nextPageToken: end < list.length ? String(end) : null,
  };
}

const notFound = (what) => new YouTubeApiError(`${what} not found`, { kind: 'notFound', status: 404 });

export function createDemoClient() {
  return {
    async getPopularVideos({ categoryId, pageToken } = {}) {
      await delay();
      const list = categoryId && categoryId !== '0' ? VIDEOS.filter((v) => v.categoryId === categoryId) : VIDEOS;
      return paginate([...list].sort((a, b) => b.views - a.views), pageToken);
    },

    async searchVideos({ q = '', pageToken } = {}) {
      await delay();
      const words = normalize(q).split(/\s+/).filter(Boolean);
      const hits = VIDEOS.filter((v) => {
        const haystack = normalize(`${v.title} ${v.channelTitle}`);
        return words.every((word) => haystack.includes(word));
      });
      return paginate(hits, pageToken, 8);
    },

    async getVideo(id) {
      await delay(150);
      const video = VIDEOS.find((v) => v.id === id);
      if (!video) throw notFound('Video');
      return { ...video };
    },

    async getChannel(id) {
      await delay(150);
      const channel = CHANNELS.find((c) => c.id === id);
      if (!channel) throw notFound('Channel');
      return {
        id: channel.id,
        title: channel.title,
        handle: channel.handle,
        description: channel.about,
        avatar: '',
        avatarLarge: '',
        banner: '',
        subscribers: channel.subscribers,
        videoCount: VIDEOS.filter((v) => v.channelId === channel.id).length,
      };
    },

    async getChannelVideos(id, { pageToken } = {}) {
      await delay();
      const list = VIDEOS.filter((v) => v.channelId === id).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
      return paginate(list, pageToken);
    },

    async getComments(videoId, { pageToken, order = 'relevance' } = {}) {
      await delay(200);
      const list = order === 'time' ? [...COMMENTS].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)) : COMMENTS;
      return paginate(list, pageToken, 5);
    },

    async getReplies() {
      await delay(150);
      return { items: REPLIES.map((reply) => ({ ...reply })) };
    },

    async getRelatedVideos(video, { limit = 20 } = {}) {
      await delay();
      const score = (v) => (v.channelId === video.channelId ? 2 : 0) + (v.categoryId === video.categoryId ? 1 : 0);
      return VIDEOS.filter((v) => v.id !== video.id)
        .sort((a, b) => score(b) - score(a) || b.views - a.views)
        .slice(0, limit)
        .map((v) => ({ ...v }));
    },
  };
}
