import { useEffect, useState } from 'react';

// – [ 2 ] + control. Typing in the box is only committed on blur / Enter, so the cart
// isn't saved on every keystroke. `max` is optional.
export default function QtyControl({ value, onChange, max }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const clamp = (n) => Math.max(1, max ? Math.min(max, n) : n);
  const set = (n) => { const next = clamp(n); if (next !== value) onChange(next); };
  const commit = () => {
    const next = clamp(parseInt(draft, 10) || 1);
    setDraft(String(next)); // snap the box back to a valid number
    if (next !== value) onChange(next);
  };

  return (
    <div className="qty-control">
      <button type="button" aria-label="Decrease quantity" onClick={() => set(value - 1)}>–</button>
      <input
        type="number"
        min="1"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button type="button" aria-label="Increase quantity" onClick={() => set(value + 1)}>+</button>
    </div>
  );
}
