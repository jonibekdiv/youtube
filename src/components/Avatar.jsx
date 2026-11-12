import { useEffect, useState } from 'react';

// Rasm bo'lmasa yoki yuklanmasa — ism bosh harfi bilan rangli doira.
function colorFor(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 45% 40%)`;
}

export default function Avatar({ src, name = '', size = 36 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    const letter = name.replace(/^[^\p{L}\p{N}]+/u, '').charAt(0).toUpperCase() || '?';
    return (
      <span
        className="avatar avatar-fallback"
        style={{ width: size, height: size, fontSize: size * 0.45, background: colorFor(name) }}
        aria-hidden="true"
      >
        {letter}
      </span>
    );
  }
  return (
    <img
      className="avatar"
      src={src}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
