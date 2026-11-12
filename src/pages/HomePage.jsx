import { useSearchParams } from 'react-router-dom';
import CategoryChips from '../components/CategoryChips.jsx';
import VideoFeed from '../components/VideoFeed.jsx';
import { api } from '../api/index.js';
import { isKnownCategory } from '../categories.js';
import { usePagedList } from '../hooks/usePagedList.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { t } from '../i18n.js';

/** Bosh sahifa: mamlakatdagi mashhur videolar (kategoriya bo'yicha filtr bilan), cheksiz aylantirish. */
export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('c');
  const category = requested && isKnownCategory(requested) ? requested : '0';

  const list = usePagedList(`home:${category}`, (pageToken) =>
    api.getPopularVideos({ categoryId: category === '0' ? undefined : category, pageToken }),
  );
  useDocumentTitle();

  return (
    <>
      <CategoryChips value={category} onChange={(id) => setParams(id === '0' ? {} : { c: id })} />
      <div className="page">
        <VideoFeed list={list} emptyTitle={t.search.empty} emptyHint={t.categories.emptyHint} />
      </div>
    </>
  );
}
