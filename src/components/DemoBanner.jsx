import { useState } from 'react';
import Icon from './Icon.jsx';
import { t } from '../i18n.js';

/** Kalitsiz (demo) rejimda sahifa tepasida chiqadigan ogohlantirish. */
export default function DemoBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="demo-banner" role="note">
      <span>{t.demo.banner}</span>
      <button type="button" className="icon-btn" onClick={() => setHidden(true)} aria-label={t.common.close}>
        <Icon name="close" size={20} />
      </button>
    </div>
  );
}
