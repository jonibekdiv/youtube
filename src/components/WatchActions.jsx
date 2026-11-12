import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { useLibrary } from '../state/library.jsx';
import { compactNumber } from '../utils/format.js';
import { t } from '../i18n.js';

/** "Yoqdi" (faqat brauzerda saqlanadi) va "Ulashish" tugmalari. */
export default function WatchActions({ video }) {
  const { isLiked, toggleLike } = useLibrary();
  const [copied, setCopied] = useState(false);
  const liked = isLiked(video.id);
  const likeCount = video.likes != null ? video.likes + (liked ? 1 : 0) : null;

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      /* foydalanuvchi ulashishni bekor qildi yoki brauzer ruxsat bermadi */
    }
  };

  return (
    <div className="watch-actions">
      <button
        type="button"
        className={`btn btn-soft${liked ? ' is-active' : ''}`}
        aria-pressed={liked}
        onClick={() => toggleLike(video.id)}
      >
        <Icon name="thumbUp" size={20} />
        {likeCount != null ? compactNumber(likeCount) : t.video.like}
      </button>
      <button type="button" className="btn btn-soft" onClick={share}>
        <Icon name="share" size={20} />
        {copied ? t.video.copied : t.video.share}
      </button>
    </div>
  );
}
