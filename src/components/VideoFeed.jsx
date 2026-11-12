import VideoCard from './VideoCard.jsx';
import VideoRow from './VideoRow.jsx';
import { VideoCardSkeleton, VideoRowSkeleton } from './Skeletons.jsx';
import ErrorState from './ErrorState.jsx';
import EmptyState from './EmptyState.jsx';
import Sentinel from './Sentinel.jsx';
import { t } from '../i18n.js';

const repeat = (count, render) => Array.from({ length: count }, (_, i) => render(i));

/**
 * usePagedList natijasini chizadi: skelet → xato → bo'sh holat → ro'yxat.
 * infinite=true — pastga aylantirganda o'zi yuklaydi; false — "Yana yuklash" tugmasi
 * (qidiruv kabi qimmat so'rovlar uchun, kvotani tejaydi).
 */
export default function VideoFeed({ list, layout = 'grid', infinite = true, emptyTitle, emptyHint }) {
  const { items, loading, loadingMore, error, hasMore, stalled, loadMore, retry } = list;
  // Oxirgi sahifa yangi video bermagan bo'lsa — avtomatik emas, tugma bilan (kvota himoyasi).
  const auto = infinite && !stalled;
  const isGrid = layout === 'grid';
  const containerClass = isGrid ? 'video-grid' : 'video-list';
  const Item = isGrid ? VideoCard : VideoRow;
  const Skeleton = isGrid ? VideoCardSkeleton : VideoRowSkeleton;

  if (loading) {
    return <div className={containerClass}>{repeat(isGrid ? 12 : 6, (i) => <Skeleton key={i} />)}</div>;
  }
  if (error && items.length === 0) return <ErrorState error={error} onRetry={retry} />;
  if (items.length === 0 && !hasMore) {
    return <EmptyState title={emptyTitle ?? t.search.empty} hint={emptyHint ?? t.search.emptyHint} />;
  }

  return (
    <>
      <div className={containerClass}>
        {items.map((video) => (
          <Item key={video.id} video={video} />
        ))}
        {loadingMore && repeat(isGrid ? 6 : 3, (i) => <Skeleton key={`more-${i}`} />)}
      </div>
      {error && <ErrorState compact error={error} onRetry={retry} />}
      {hasMore && auto && (
        <Sentinel onVisible={loadMore} disabled={loadingMore || Boolean(error)} version={items.length} />
      )}
      {hasMore && !auto && !loadingMore && !error && (
        <div className="load-more">
          <button type="button" className="btn btn-soft" onClick={loadMore}>
            {t.common.loadMore}
          </button>
        </div>
      )}
    </>
  );
}
