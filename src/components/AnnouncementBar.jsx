import { ANNOUNCEMENTS, FREE_SHIPPING_THRESHOLD } from '../lib/constants';
import { formatPrice } from '../lib/format';

// Quiet strip above the header. Messages live in constants.js.
export default function AnnouncementBar() {
  const messages = FREE_SHIPPING_THRESHOLD
    ? [`Complimentary shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`, ...ANNOUNCEMENTS]
    : ANNOUNCEMENTS;
  return (
    <div className="ann-bar">
      <ul className="container">
        {messages.map((text) => <li key={text}>{text}</li>)}
      </ul>
    </div>
  );
}
