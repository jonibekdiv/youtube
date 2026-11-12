import { DEMO_MODE } from '../config.js';
import { t } from '../i18n.js';

// YouTube'ning rasmiy embed kodidagi ruxsatlar (to'liq ekran — alohida allowFullScreen atributi bilan).
const EMBED_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

/** Video pleyeri: YouTube'ning rasmiy iframe pleyeri (videoni yuklab olmaymiz, faqat joylashtiramiz). */
export default function Player({ video }) {
  if (DEMO_MODE) {
    return (
      <div className="player player-note player-demo" style={{ backgroundImage: `url("${video.thumbnail}")` }}>
        <p className="player-note-text">{t.demo.player}</p>
      </div>
    );
  }

  if (!video.embeddable) {
    return (
      <div className="player player-note">
        <div className="player-note-text">
          <p>{t.video.notEmbeddable}</p>
          <a
            className="btn btn-inverse"
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.video.openOnYouTube}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <iframe
        key={video.id}
        title={video.title}
        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
        allow={EMBED_ALLOW}
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
