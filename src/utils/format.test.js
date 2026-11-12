import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compactNumber,
  formatDate,
  formatDuration,
  groupDigits,
  isValidVideoId,
  parseDuration,
  splitLinks,
  timeAgo,
} from './format.js';

test('parseDuration: ISO 8601 → soniya', () => {
  assert.equal(parseDuration('PT1H2M3S'), 3723);
  assert.equal(parseDuration('PT45S'), 45);
  assert.equal(parseDuration('PT10M'), 600);
  assert.equal(parseDuration('PT1H'), 3600);
  assert.equal(parseDuration('P1DT2H'), 93600);
  assert.equal(parseDuration('P0D'), 0); // jonli efir
  assert.equal(parseDuration('nonsense'), 0);
  assert.equal(parseDuration(undefined), 0);
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(9), '0:09');
  assert.equal(formatDuration(63), '1:03');
  assert.equal(formatDuration(600), '10:00');
  assert.equal(formatDuration(3723), '1:02:03');
  assert.equal(formatDuration(null), '0:00');
});

test("compactNumber: qirqib, o'nli kasr vergul bilan", () => {
  assert.equal(compactNumber(0), '0');
  assert.equal(compactNumber(999), '999');
  assert.equal(compactNumber(1000), '1 ming');
  assert.equal(compactNumber(1234), '1,2 ming');
  assert.equal(compactNumber(2300), '2,3 ming'); // suzuvchi nuqta tuzog'i: 2.3 * 10 !== 23
  assert.equal(compactNumber(9999), '9,9 ming');
  assert.equal(compactNumber(15300), '15 ming');
  assert.equal(compactNumber(999_999), '999 ming');
  assert.equal(compactNumber(1_000_000), '1 mln');
  assert.equal(compactNumber(1_990_000), '1,9 mln');
  assert.equal(compactNumber(12_400_000), '12 mln');
  assert.equal(compactNumber(2_480_000_000), '2,4 mlrd');
  assert.equal(compactNumber(null), '');
  assert.equal(compactNumber(undefined), '');
  assert.equal(compactNumber(Number.NaN), '');
});

test('groupDigits', () => {
  assert.equal(groupDigits(1234567), '1 234 567');
  assert.equal(groupDigits(12), '12');
  assert.equal(groupDigits(null), '');
});

test('timeAgo', () => {
  const now = Date.parse('2026-06-15T12:00:00Z');
  const ago = (ms) => timeAgo(new Date(now - ms).toISOString(), now);
  const MIN = 60_000;
  const DAY = 86_400_000;
  assert.equal(ago(30_000), 'hozirgina');
  assert.equal(ago(5 * MIN), '5 daqiqa oldin');
  assert.equal(ago(3 * 60 * MIN), '3 soat oldin');
  assert.equal(ago(2 * DAY), '2 kun oldin');
  assert.equal(ago(21 * DAY), '3 hafta oldin');
  assert.equal(ago(70 * DAY), '2 oy oldin');
  assert.equal(ago(800 * DAY), '2 yil oldin');
  assert.equal(timeAgo('not a date', now), '');
  // kelajakdagi sana (soat farqi) manfiy chiqmasin
  assert.equal(timeAgo(new Date(now + 5 * MIN).toISOString(), now), 'hozirgina');
});

test('formatDate', () => {
  assert.equal(formatDate('2025-03-05T12:00:00Z'), '2025-yil 5-mart');
  assert.equal(formatDate('garbage'), '');
});

test('splitLinks: havolalarni ajratadi, oxiridagi tinish belgilarini olib tashlaydi', () => {
  assert.deepEqual(splitLinks('Salom https://a.com/x, va http://b.org.'), [
    { type: 'text', value: 'Salom ' },
    { type: 'link', value: 'https://a.com/x' },
    { type: 'text', value: ', va ' },
    { type: 'link', value: 'http://b.org' },
    { type: 'text', value: '.' },
  ]);
  assert.deepEqual(splitLinks('havolasiz matn'), [{ type: 'text', value: 'havolasiz matn' }]);
  assert.deepEqual(splitLinks(''), []);
  // javascript: kabi sxemalar havola sifatida tanilmaydi
  assert.deepEqual(splitLinks('javascript:alert(1)'), [{ type: 'text', value: 'javascript:alert(1)' }]);
});

test('isValidVideoId', () => {
  assert.ok(isValidVideoId('dQw4w9WgXcQ'));
  assert.ok(isValidVideoId('demo-vid-01'));
  assert.ok(!isValidVideoId('short'));
  assert.ok(!isValidVideoId('dQw4w9WgXcQ/../x'));
  assert.ok(!isValidVideoId('abc?autoplay=1'));
  assert.ok(!isValidVideoId(null));
});
