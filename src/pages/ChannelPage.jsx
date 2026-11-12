import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import ErrorState from '../components/ErrorState.jsx';
import SubscribeButton from '../components/SubscribeButton.jsx';
import VideoFeed from '../components/VideoFeed.jsx';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { usePagedList } from '../hooks/usePagedList.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { compactNumber } from '../utils/format.js';
import { t } from '../i18n.js';

function ChannelBanner({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="channel-banner">
      <img src={src} alt="" onError={() => setFailed(true)} />
    </div>
  );
}

/** Kanal sahifasi: /channel/UC... — banner, ma'lumot va kanalning barcha videolari. */
export default function ChannelPage() {
  const { channelId } = useParams();
  const channel = useAsync(`channel:${channelId}`, () => api.getChannel(channelId));
  const list = usePagedList(`uploads:${channelId}`, (pageToken) => api.getChannelVideos(channelId, { pageToken }));
  const c = channel.data;
  useDocumentTitle(c?.title);

  if (channel.error) {
    return (
      <div className="page">
        <ErrorState error={channel.error} onRetry={channel.retry} />
      </div>
    );
  }

  const meta = c
    ? [
        c.handle,
        c.subscribers != null ? t.channel.subscribers(compactNumber(c.subscribers)) : '',
        c.videoCount != null ? t.channel.videos(compactNumber(c.videoCount)) : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div className="channel-page">
      {c?.banner && <ChannelBanner key={c.banner} src={c.banner} />}
      <header className="channel-header">
        {c ? (
          <>
            <Avatar src={c.avatarLarge} name={c.title} size={128} />
            <div className="channel-header-info">
              <h1>{c.title}</h1>
              <p className="muted">{meta}</p>
              {c.description && <p className="channel-about">{c.description}</p>}
              <SubscribeButton channel={c} />
            </div>
          </>
        ) : (
          <>
            <div className="avatar skeleton" style={{ width: 128, height: 128 }} aria-hidden="true" />
            <div className="channel-header-info" aria-hidden="true">
              <div className="skeleton line line-lg" style={{ width: 260 }} />
              <div className="skeleton line" style={{ width: 200 }} />
            </div>
          </>
        )}
      </header>

      <div className="page">
        <h2 className="channel-tab">{t.channel.videosTab}</h2>
        <VideoFeed list={list} emptyTitle={t.channel.empty} emptyHint="" />
      </div>
    </div>
  );
}
