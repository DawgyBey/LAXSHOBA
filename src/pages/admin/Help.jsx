import useDocumentTitle from '../../hooks/useDocumentTitle';

const HELP_ITEMS = [
  { q: 'How do I add a product?', a: 'Open Products, choose Add product, fill in the name, price, photos, and stock, then save. If you are not ready to show it, switch it to hidden.' },
  { q: 'How do I change an order status?', a: 'Open Orders, choose the order, and select the next step from the status list. The list only shows steps that are allowed by the shop rules.' },
  { q: 'What does each order status mean?', a: 'Pending means a new order needs attention. Confirmed means you have accepted it. Processing means it is being packed. Shipped means it has left the shop. Delivered means it reached the customer. Cancelled means the order was stopped and stock was returned.' },
  { q: 'How do I cancel an order?', a: 'Choose Cancelled in the order status list. The system will return the items to stock and keep a record of the change.' },
  { q: 'How do I hide a product?', a: 'Open the product and switch Show on website to off, or choose Hide in the product list. Hidden products still stay in the admin list.' },
  { q: 'How do I change the homepage banner?', a: 'Open Website Homepage and update the banner image and text. You can also choose which products appear in the featured section.' },
  { q: 'How do I export orders?', a: 'Use the export option in the Orders page to download a CSV for a date range. This is useful for packing lists or counting sales.' },
  { q: 'What should I do if a customer says they paid?', a: 'Open the order and mark it as paid if payment was received. Then check the payment method, bank slip, or wallet confirmation before shipping.' },
  { q: 'How do I keep stock accurate?', a: 'When an item sells out, change the stock count in the product list and check the Low stock filter often. Keep the stock number honest so customers do not order something unavailable.' },
];

export default function Help() {
  useDocumentTitle('Help — Admin');

  return (
    <div className="help-page">
      <section className="page-intro">
        <div>
          <span className="section-kicker">Quick help</span>
          <h1>Help</h1>
          <p>Short answers for the daily shop work.</p>
        </div>
      </section>

      <div className="help-list">
        {HELP_ITEMS.map((item) => (
          <article key={item.q} className="help-item">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
