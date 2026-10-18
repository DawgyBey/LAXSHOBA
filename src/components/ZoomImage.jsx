import { useState } from 'react';

// Product photo with hover-zoom (mouse only). The frame takes the photo's own shape, so a landscape
// or portrait picture is shown whole instead of being cropped to a fixed portrait box.
const MIN_RATIO = 0.66; // tallest frame (2:3)
const MAX_RATIO = 1.8;  // widest frame (~16:9)

export default function ZoomImage({ src, alt, className = '', zoom = 2, ...props }) {
  const [ratio, setRatio] = useState(3 / 4); // until the photo loads
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);

  function follow(event) {
    // Touch and pen scroll the page instead of zooming.
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const clamp = (n) => Math.min(100, Math.max(0, n));
    setOrigin({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
    });
    setZoomed(true);
  }

  function onLoad(event) {
    const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
    if (w && h) setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, w / h)));
  }

  return (
    <span
      className={`zoom-image${zoomed ? ' is-zoomed' : ''}${className ? ` ${className}` : ''}`}
      style={{ aspectRatio: ratio, '--zoom-level': zoom, '--zoom-x': `${origin.x}%`, '--zoom-y': `${origin.y}%` }}
      onPointerEnter={follow}
      onPointerMove={follow}
      onPointerLeave={() => setZoomed(false)}
    >
      <img src={src} alt={alt} draggable="false" decoding="async" onLoad={onLoad} {...props} />
    </span>
  );
}
