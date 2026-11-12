import { Link } from 'react-router-dom';
import { formatDuration } from '../utils/format.js';
import { t } from '../i18n.js';

// Muqova rasmi + davomiylik/JONLI belgisi. Matnli havola sarlavhada bo'lgani uchun bu havola
// klaviatura tartibiga va ekran o'quvchiga kirmaydi (takrorlanmasligi uchun).
export default function Thumbnail({ video, to }) {
  const badge = video.isLive ? t.video.live : video.duration ? formatDuration(video.duration) : '';
  return (
    <Link to={to} className="thumb" tabIndex={-1} aria-hidden="true">
      {video.thumbnail && <img src={video.thumbnail} alt="" loading="lazy" decoding="async" />}
      {badge && <span className={`badge${video.isLive ? ' badge-live' : ''}`}>{badge}</span>}
    </Link>
  );
}
