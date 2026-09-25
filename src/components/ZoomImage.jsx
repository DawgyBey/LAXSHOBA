import { useState } from 'react';

export default function ZoomImage({ src, alt, className = '', zoom = 2.2, ...props }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);

  function updatePosition(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }

  return (
    <span
      className={`zoom-image${zoomed ? ' is-zoomed' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--zoom-level': zoom,
        '--zoom-x': `${position.x}%`,
        '--zoom-y': `${position.y}%`,
        '--zoom-image': `url("${src}")`,
      }}
      onPointerEnter={() => setZoomed(true)}
      onPointerMove={updatePosition}
      onPointerLeave={() => setZoomed(false)}
    >
      <img src={src} alt={alt} {...props} />
      <span className="zoom-image-preview" aria-hidden="true" />
    </span>
  );
}