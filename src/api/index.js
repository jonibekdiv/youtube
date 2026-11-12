// UI shu yerdan `api` ni oladi. Kalit bo'lsa — haqiqiy YouTube API, bo'lmasa — demo ma'lumotlar.
import { API_KEY, DEMO_MODE, PAGE_SIZE, REGION_CODE } from '../config.js';
import { createDemoClient } from './demo.js';
import { createYouTubeClient } from './youtube.js';

export const api = DEMO_MODE
  ? createDemoClient()
  : createYouTubeClient({ apiKey: API_KEY, regionCode: REGION_CODE, pageSize: PAGE_SIZE });
