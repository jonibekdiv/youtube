import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import { CATEGORIES } from '../categories.js';
import { useLibrary } from '../state/library.jsx';
import { t } from '../i18n.js';

const SIDEBAR_CATEGORIES = CATEGORIES.filter((c) => c.sidebar);
const MINI_CATEGORY_COUNT = 3;

function NavItem({ to, label, active, icon, avatar }) {
  return (
    <Link to={to} className="nav-item" aria-current={active ? 'page' : undefined}>
      {avatar ?? <Icon name={icon} />}
      <span className="nav-label">{label}</span>
    </Link>
  );
}

/**
 * mode: 'full' (240px) | 'mini' (faqat ikonkalar) | 'overlay' (tomosha sahifasi va tor ekranlarda
 * chap tomondan chiqadigan menyu).
 */
export default function Sidebar({ mode, open, onClose }) {
  const location = useLocation();
  const [params] = useSearchParams();
  const { subscriptions } = useLibrary();

  const onHome = location.pathname === '/';
  const currentCategory = params.get('c') ?? '0';
  const mini = mode === 'mini';
  const categories = mini ? SIDEBAR_CATEGORIES.slice(0, MINI_CATEGORY_COUNT) : SIDEBAR_CATEGORIES;
  const hidden = mode === 'overlay' && !open;

  return (
    <>
      {mode === 'overlay' && open && <div className="backdrop" onClick={onClose} />}
      <aside
        className={`sidebar sidebar-${mode}${open ? ' open' : ''}`}
        aria-label={t.nav.mainMenu}
        inert={hidden}
      >
        <nav>
          <NavItem to="/" icon="home" label={t.nav.home} active={onHome && currentCategory === '0'} />
          {mini &&
            categories.map((c) => (
              <NavItem key={c.id} to={`/?c=${c.id}`} icon={c.icon} label={c.label} active={onHome && currentCategory === c.id} />
            ))}

          {!mini && (
            <>
              <hr className="sidebar-divider" />
              <h2 className="nav-title">{t.nav.explore}</h2>
              {categories.map((c) => (
                <NavItem key={c.id} to={`/?c=${c.id}`} icon={c.icon} label={c.label} active={onHome && currentCategory === c.id} />
              ))}

              <hr className="sidebar-divider" />
              <h2 className="nav-title">{t.nav.subscriptions}</h2>
              {subscriptions.length === 0 && <p className="sidebar-empty">{t.nav.noSubscriptions}</p>}
              {subscriptions.map((channel) => (
                <NavItem
                  key={channel.id}
                  to={`/channel/${channel.id}`}
                  label={channel.title}
                  active={location.pathname === `/channel/${channel.id}`}
                  avatar={<Avatar src={channel.avatar} name={channel.title} size={24} />}
                />
              ))}
            </>
          )}
        </nav>

        {!mini && (
          <footer className="sidebar-footer">
            <p>{t.legal.usesApi}</p>
            <p>
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
                {t.legal.terms}
              </a>
              {' · '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                {t.legal.privacy}
              </a>
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
