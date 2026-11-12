// YouTube API xatolarini tasniflash. UI `kind` bo'yicha tushunarli xabar ko'rsatadi (utils/describeError.js).
export class YouTubeApiError extends Error {
  constructor(message, { kind = 'unknown', status = 0, reason = '' } = {}) {
    super(message);
    this.name = 'YouTubeApiError';
    this.kind = kind;
    this.status = status;
    this.reason = reason;
  }
}

const QUOTA_REASONS = new Set([
  'quotaExceeded',
  'dailyLimitExceeded',
  'rateLimitExceeded',
  'userRateLimitExceeded',
]);

const stripTags = (text) => String(text ?? '').replace(/<[^>]*>/g, '');

/** Google xato javobini (status + JSON tanasi) YouTubeApiError'ga aylantiradi. */
export function classifyApiError(status, body) {
  const err = body?.error ?? {};
  const reason = err.errors?.[0]?.reason ?? '';
  const detailReason = (err.details ?? []).find((d) => d?.reason)?.reason ?? '';
  const message = stripTags(err.message);

  let kind = 'unknown';
  if (QUOTA_REASONS.has(reason)) kind = 'quota';
  else if (
    detailReason === 'API_KEY_INVALID' ||
    reason === 'keyInvalid' ||
    /api key not valid|missing a valid api key/i.test(message)
  ) kind = 'key';
  else if (
    detailReason === 'API_KEY_HTTP_REFERRER_BLOCKED' ||
    reason === 'ipRefererBlocked' ||
    /referer/i.test(message)
  ) kind = 'referrer';
  else if (reason === 'accessNotConfigured' || detailReason === 'SERVICE_DISABLED') kind = 'notEnabled';
  else if (reason === 'commentsDisabled') kind = 'commentsDisabled';
  else if (status === 404 || /NotFound$/.test(reason)) kind = 'notFound';

  return new YouTubeApiError(message || `HTTP ${status}`, { kind, status, reason: reason || detailReason });
}
