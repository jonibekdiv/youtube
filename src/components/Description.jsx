import { useState } from 'react';
import { formatDate, groupDigits, splitLinks } from '../utils/format.js';
import { t } from '../i18n.js';

/** Video tavsifi: dastlab 3 qator, "Ko'proq" bosilganda to'liq. Havolalar bosiladigan qilinadi. */
export default function Description({ video }) {
  const [expanded, setExpanded] = useState(false);
  const text = (video.description ?? '').trim();
  const isLong = text.length > 180 || text.split('\n').length > 3;
  const stats = [
    video.views != null ? t.video.viewsFull(groupDigits(video.views)) : '',
    formatDate(video.publishedAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className={`description${expanded ? ' expanded' : ''}`}>
      <div className="description-stats">{stats}</div>
      {text && (
        <div className="description-text">
          {splitLinks(text).map((part, i) =>
            part.type === 'link' ? (
              <a key={i} href={part.value} target="_blank" rel="noopener noreferrer nofollow">
                {part.value}
              </a>
            ) : (
              <span key={i}>{part.value}</span>
            ),
          )}
        </div>
      )}
      {isLong && (
        <button type="button" className="link-button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? t.video.showLess : t.video.showMore}
        </button>
      )}
    </section>
  );
}
