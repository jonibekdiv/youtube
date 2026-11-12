import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import DemoBanner from './components/DemoBanner.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChannelPage from './pages/ChannelPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import WatchPage from './pages/WatchPage.jsx';
import { DEMO_MODE } from './config.js';
import { useMediaQuery } from './hooks/useMediaQuery.js';
import { useStoredState } from './hooks/useStoredState.js';

function initialTheme() {
  const fromHtml = document.documentElement.dataset.theme; // index.html dagi skript o'rnatgan
  if (fromHtml === 'light' || fromHtml === 'dark') return fromHtml;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const location = useLocation();
  const isNarrow = useMediaQuery('(max-width: 900px)');
  // Tomosha sahifasida va tor ekranlarda menyu ustiga chiqadi (YouTube'dagidek).
  const overlay = location.pathname === '/watch' || isNarrow;

  const [wideSidebar, setWideSidebar] = useStoredState('tomosha.sidebar', true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storedTheme, setTheme] = useStoredState('tomosha.theme', initialTheme);
  const theme = storedTheme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Sahifa almashganda: menyuni yopamiz va tepaga qaytamiz.
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  const mode = overlay ? 'overlay' : wideSidebar ? 'full' : 'mini';
  const toggleMenu = () => (overlay ? setDrawerOpen((open) => !open) : setWideSidebar((wide) => !wide));

  return (
    <>
      <Header
        onMenu={toggleMenu}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <Sidebar mode={mode} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className={`main main-${mode}`}>
        {DEMO_MODE && <DemoBanner />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<SearchPage />} />
          <Route path="/watch" element={<WatchPage />} />
          <Route path="/channel/:channelId" element={<ChannelPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}
