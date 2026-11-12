import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import Thumbnail from './Thumbnail.jsx';
import VideoStats from './VideoStats.jsx';

/** Qidiruv natijalari (katta) va tomosha sahifasidagi tavsiyalar (compact) uchun qator ko'rinishi. */
export default function VideoRow({ video, compact = false }) {
  const watchUrl = `/watch?v=${video.id}`;
  const channelUrl = `/channel/${video.channelId}`;
  return (
    <article className={`video-row${compact ? ' compact' : ''}`}>
      <Thumbnail video={video} to={watchUrl} />
      <div className="row-text">
        <h3 className="row-title">
          <Link to={watchUrl} title={video.title}>
            {video.title}
          </Link>
        </h3>
        {compact ? (
          <>
            <Link to={channelUrl} className="row-channel">
              {video.channelTitle}
            </Link>
            <VideoStats video={video} />
          </>
        ) : (
          <>
            <VideoStats video={video} />
            <Link to={channelUrl} className="row-channel">
              <Avatar src={video.channelAvatar} name={video.channelTitle} size={24} />
              <span>{video.channelTitle}</span>
            </Link>
            {video.description && <p className="row-description">{video.description}</p>}
          </>
        )}
      </div>
    </article>
  );
}
