import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from './Icon.jsx';
import { APP_NAME } from '../config.js';
import { t } from '../i18n.js';

function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${APP_NAME} — ${t.nav.home}`}>
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="var(--accent)" />
        <path d="M13 9.5v13l11-6.5z" fill="#fff" />
      </svg>
      <span className="logo-text">{APP_NAME}</span>
    </Link>
  );
}

export default function Header({ onMenu, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // Natijalar sahifasida qidiruv maydoni URL bilan sinxron turadi (orqaga/oldinga o'tganda ham).
  const urlQuery = location.pathname === '/results' ? (params.get('search_query') ?? '') : null;
  const [query, setQuery] = useState(urlQuery ?? '');
  useEffect(() => {
    if (urlQuery !== null) setQuery(urlQuery);
  }, [urlQuery]);

  const submit = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate(`/results?search_query=${encodeURIComponent(q)}`);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button type="button" className="icon-btn" onClick={onMenu} aria-label={t.nav.menu}>
          <Icon name="menu" />
        </button>
        <Logo />
      </div>

      <form className="search" role="search" onSubmit={submit}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search.placeholder}
          aria-label={t.search.label}
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" aria-label={t.search.label}>
          <Icon name="search" />
        </button>
      </form>

      <div className="header-right">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t.theme.toLight : t.theme.toDark}
          title={theme === 'dark' ? t.theme.toLight : t.theme.toDark}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  );
}
