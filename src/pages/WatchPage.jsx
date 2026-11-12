import { useSearchParams } from 'react-router-dom';
import ChannelRow from '../components/ChannelRow.jsx';
import Comments from '../components/Comments.jsx';
import Description from '../components/Description.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Player from '../components/Player.jsx';
import VideoRow from '../components/VideoRow.jsx';
import WatchActions from '../components/WatchActions.jsx';
import { VideoRowSkeleton } from '../components/Skeletons.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { isValidVideoId } from '../utils/format.js';
import { t } from '../i18n.js';

function ChannelRowSkeleton() {
  return (
    <div className="channel-row" aria-hidden="true">
      <div className="avatar skeleton" style={{ width: 40, height: 40 }} />
      <div className="skeleton line" style={{ width: 160 }} />
    </div>
  );
}

function WatchInfoSkeleton() {
  return (
    <div className="watch-info" aria-hidden="true">
      <div className="skeleton line line-lg" style={{ width: '70%', marginTop: 16 }} />
      <div className="watch-bar">
        <ChannelRowSkeleton />
      </div>
    </div>
  );
}

/** Tomosha sahifasi: /watch?v=VIDEO_ID */
export default function WatchPage() {
  const [params] = useSearchParams();
  const id = params.get('v') ?? '';
  const valid = isValidVideoId(id);

  const video = useAsync(valid ? `video:${id}` : null, () => api.getVideo(id));
  const v = video.data;
  const channel = useAsync(v ? `channel:${v.channelId}` : null, () => api.getChannel(v.channelId));
  const related = useAsync(v ? `related:${v.id}` : null, () => api.getRelatedVideos(v));
  useDocumentTitle(v?.title);

  if (!valid) return <NotFoundPage />;
  if (video.error) {
    return (
      <div className="page">
        <ErrorState error={video.error} onRetry={video.retry} />
      </div>
    );
  }

  // Kanal ma'lumoti kelmaguncha — skelet; kela olmasa — videodagi qisqa ma'lumot bilan ko'rsatamiz.
  const channelInfo =
    channel.data ??
    (channel.error && v ? { id: v.channelId, title: v.channelTitle, avatar: '', subscribers: null } : null);

  return (
    <div className="watch">
      <div className="watch-main">
        {v ? <Player video={v} /> : <div className="player skeleton" />}
        {v ? (
          // key: boshqa videoga o'tganda tavsif/izohlar holati (ochiq-yopiq, saralash) noldan boshlansin
          <div className="watch-info" key={v.id}>
            <h1 className="watch-title">{v.title}</h1>
            <div className="watch-bar">
              {channelInfo ? <ChannelRow channel={channelInfo} /> : <ChannelRowSkeleton />}
              <WatchActions video={v} />
            </div>
            <Description video={v} />
            <Comments videoId={v.id} total={v.commentCount} />
          </div>
        ) : (
          <WatchInfoSkeleton />
        )}
      </div>

      <aside className="watch-side" aria-label={t.video.related}>
        {related.error ? (
          <ErrorState compact error={related.error} onRetry={related.retry} />
        ) : related.data ? (
          related.data.map((item) => <VideoRow key={item.id} video={item} compact />)
        ) : (
          Array.from({ length: 8 }, (_, i) => <VideoRowSkeleton key={i} compact />)
        )}
      </aside>
    </div>
  );
}
