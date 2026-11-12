import { useState } from 'react';
import Avatar from './Avatar.jsx';
import ErrorState from './ErrorState.jsx';
import Icon from './Icon.jsx';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { usePagedList } from '../hooks/usePagedList.js';
import { compactNumber, groupDigits, timeAgo } from '../utils/format.js';
import { t } from '../i18n.js';

function CommentSkeleton() {
  return (
    <li className="comment" aria-hidden="true">
      <div className="avatar skeleton" style={{ width: 40, height: 40 }} />
      <div className="comment-body" style={{ flex: 1 }}>
        <div className="skeleton line" style={{ width: '30%' }} />
        <div className="skeleton line" style={{ width: '85%' }} />
      </div>
    </li>
  );
}

function Replies({ parentId }) {
  const replies = useAsync(`replies:${parentId}`, () => api.getReplies(parentId));
  if (replies.loading) {
    return (
      <ul className="comment-list">
        <CommentSkeleton />
      </ul>
    );
  }
  if (replies.error) return <ErrorState compact error={replies.error} onRetry={replies.retry} />;
  return (
    <ul className="comment-list">
      {replies.data.items.map((reply) => (
        <CommentItem key={reply.id} comment={reply} isReply />
      ))}
    </ul>
  );
}

function CommentItem({ comment, isReply = false }) {
  const [showReplies, setShowReplies] = useState(false);
  return (
    <li className={`comment${isReply ? ' comment-reply' : ''}`}>
      <Avatar src={comment.authorAvatar} name={comment.author} size={isReply ? 24 : 40} />
      <div className="comment-body">
        <div className="comment-head">
          <span className="comment-author">{comment.author}</span>
          <span className="muted">{timeAgo(comment.publishedAt)}</span>
        </div>
        <p className="comment-text">{comment.text}</p>
        {comment.likes > 0 && (
          <span className="comment-likes muted">
            <Icon name="thumbUp" size={16} />
            {compactNumber(comment.likes)}
          </span>
        )}
        {!isReply && comment.replyCount > 0 && (
          <div>
            <button
              type="button"
              className="link-button"
              aria-expanded={showReplies}
              onClick={() => setShowReplies((v) => !v)}
            >
              {showReplies ? t.comments.hideReplies : t.comments.showReplies(comment.replyCount)}
            </button>
            {showReplies && <Replies parentId={comment.id} />}
          </div>
        )}
      </div>
    </li>
  );
}

/** Izohlar bo'limi: saralash (mashhur/yangi), javoblar va "Yana yuklash". */
export default function Comments({ videoId, total }) {
  const [order, setOrder] = useState('relevance');
  const list = usePagedList(`comments:${videoId}:${order}`, (pageToken) =>
    api.getComments(videoId, { pageToken, order }),
  );
  const { items, loading, loadingMore, error, hasMore, loadMore, retry } = list;
  const disabled = error?.kind === 'commentsDisabled';

  let body;
  if (loading) {
    body = (
      <ul className="comment-list">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </ul>
    );
  } else if (disabled) {
    body = <p className="muted">{t.comments.disabled}</p>;
  } else if (error && items.length === 0) {
    body = <ErrorState compact error={error} onRetry={retry} />;
  } else if (items.length === 0) {
    body = <p className="muted">{t.comments.empty}</p>;
  } else {
    body = (
      <>
        <ul className="comment-list">
          {items.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          {loadingMore && <CommentSkeleton />}
        </ul>
        {error && <ErrorState compact error={error} onRetry={retry} />}
        {hasMore && !loadingMore && !error && (
          <div className="load-more">
            <button type="button" className="btn btn-soft" onClick={loadMore}>
              {t.common.loadMore}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="comments-head">
        <h2 id="comments-title">
          {total != null && !disabled ? t.comments.count(groupDigits(total)) : t.comments.title}
        </h2>
        {!disabled && (
          <div className="segmented" role="group" aria-label={t.comments.title}>
            <button type="button" aria-pressed={order === 'relevance'} onClick={() => setOrder('relevance')}>
              {t.comments.sortTop}
            </button>
            <button type="button" aria-pressed={order === 'time'} onClick={() => setOrder('time')}>
              {t.comments.sortNew}
            </button>
          </div>
        )}
      </div>
      {body}
    </section>
  );
}
