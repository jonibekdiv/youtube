import { compactNumber, timeAgo } from '../utils/format.js';
import { t } from '../i18n.js';

/** "1,2 mln ko'rish · 3 kun oldin" */
export default function VideoStats({ video }) {
  const parts = [
    video.views != null ? t.video.views(compactNumber(video.views)) : '',
    video.publishedAt ? timeAgo(video.publishedAt) : '',
  ].filter(Boolean);
  return <div className="video-stats">{parts.join(' · ')}</div>;
}
