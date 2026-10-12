export default function Loading({ message = 'Loading…' }) {
  return (
    <section className="section">
      <div className="container"><p className="empty-state">{message}</p></div>
    </section>
  );
}
