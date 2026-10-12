import { useEffect, useState } from 'react';

export default function CursorFollower() {
  const [enabled, setEnabled] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const updateEnabled = () => setEnabled(pointerQuery.matches);
    updateEnabled();
    pointerQuery.addEventListener('change', updateEnabled);
    return () => pointerQuery.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove('has-custom-cursor');
      return undefined;
    }

    document.body.classList.add('has-custom-cursor');
    const move = (event) => {
      setX(event.clientX);
      setY(event.clientY);
      setInteractive(Boolean(event.target.closest('a, button, [role="button"]')));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className={`cursor-follower${interactive ? ' is-interactive' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      aria-hidden="true"
    />
  );
}