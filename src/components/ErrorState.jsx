import Icon from './Icon.jsx';
import { describeError } from '../utils/describeError.js';
import { t } from '../i18n.js';

/** API xatosini tushunarli xabar va "Qayta urinish" tugmasi bilan ko'rsatadi. */
export default function ErrorState({ error, onRetry, compact = false }) {
  const { title, hint } = describeError(error);
  const showDetail = (!error?.kind || error.kind === 'unknown') && error?.message;
  return (
    <div className={`state${compact ? ' state-compact' : ''}`} role="alert">
      <Icon name="alert" size={compact ? 28 : 48} />
      <h2 className="state-title">{title}</h2>
      <p className="state-hint">{hint}</p>
      {showDetail && <p className="state-detail">{error.message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-soft" onClick={onRetry}>
          {t.common.retry}
        </button>
      )}
    </div>
  );
}
