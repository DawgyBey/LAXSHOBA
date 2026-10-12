import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

let nextId = 1;

// Shows the little confirmation messages fired by toast() (add to bag, wishlist, errors).
export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function onToast(event) {
      const id = nextId++;
      setToasts((list) => [...list.slice(-2), { id, ...event.detail }]);
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
    }
    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.tone === 'error' ? ' toast-error' : ''}`}>
          <span>{t.message}</span>
          {t.action && <Link to={t.action.to}>{t.action.label}</Link>}
        </div>
      ))}
    </div>
  );
}
