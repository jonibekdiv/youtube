import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import Thumbnail from './Thumbnail.jsx';
import VideoStats from './VideoStats.jsx';

/** Bosh sahifa va kanal sahifasidagi katak ko'rinishidagi video. */
export default function VideoCard({ video }) {
  const watchUrl = `/watch?v=${video.id}`;
  const channelUrl = `/channel/${video.channelId}`;
  return (
    <article className="video-card">
      <Thumbnail video={video} to={watchUrl} />
      <div className="card-body">
        <Link to={channelUrl} className="card-avatar" tabIndex={-1} aria-hidden="true">
          <Avatar src={video.channelAvatar} name={video.channelTitle} size={36} />
        </Link>
        <div className="card-text">
          <h3 className="card-title">
            <Link to={watchUrl} title={video.title}>
              {video.title}
            </Link>
          </h3>
          <Link to={channelUrl} className="card-channel">
            {video.channelTitle}
          </Link>
          <VideoStats video={video} />
        </div>
      </div>
    </article>
  );
}
