import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import SubscribeButton from './SubscribeButton.jsx';
import { compactNumber } from '../utils/format.js';
import { t } from '../i18n.js';

/** Tomosha sahifasida: kanal avatari, nomi, obunachilar soni va "Obuna bo'lish" tugmasi. */
export default function ChannelRow({ channel }) {
  const url = `/channel/${channel.id}`;
  return (
    <div className="channel-row">
      <Link to={url} tabIndex={-1} aria-hidden="true">
        <Avatar src={channel.avatar} name={channel.title} size={40} />
      </Link>
      <div className="channel-meta">
        <Link to={url} className="channel-name">
          {channel.title}
        </Link>
        {channel.subscribers != null && (
          <span className="muted">{t.channel.subscribers(compactNumber(channel.subscribers))}</span>
        )}
      </div>
      <SubscribeButton channel={channel} />
    </div>
  );
}
