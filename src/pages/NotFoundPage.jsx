import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { t } from '../i18n.js';

export default function NotFoundPage() {
  useDocumentTitle(t.common.pageNotFound);
  return (
    <div className="page">
      <div className="state">
        <h1 className="state-title">{t.common.pageNotFound}</h1>
        <Link className="btn btn-inverse" to="/">
          {t.common.backHome}
        </Link>
      </div>
    </div>
  );
}
