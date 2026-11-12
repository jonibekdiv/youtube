import { Navigate, useSearchParams } from 'react-router-dom';
import VideoFeed from '../components/VideoFeed.jsx';
import { api } from '../api/index.js';
import { usePagedList } from '../hooks/usePagedList.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const NOTHING = { items: [], nextPageToken: null };

/** Qidiruv natijalari. Har bir sahifa 100 kvota birligi — shuning uchun avtomatik emas, tugma bilan yuklanadi. */
export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('search_query') ?? '').trim();

  const list = usePagedList(`search:${q}`, (pageToken) =>
    q ? api.searchVideos({ q, pageToken }) : Promise.resolve(NOTHING),
  );
  useDocumentTitle(q || undefined);

  if (!q) return <Navigate to="/" replace />;
  return (
    <div className="page">
      <h1 className="visually-hidden">{q}</h1>
      <VideoFeed list={list} layout="list" infinite={false} />
    </div>
  );
}
