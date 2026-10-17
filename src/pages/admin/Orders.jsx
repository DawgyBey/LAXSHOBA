import { useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatDate, formatPrice, shortOrderId } from '../../lib/format';
import { getAdminOrders, updateOrder } from '../../lib/data';
import { toast } from '../../lib/toast';

export default function Orders() {
  useDocumentTitle('Orders — Admin');

  const orders = useAsync(async () => getAdminOrders());
  const [pending, setPending] = useState({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  async function changeStatus(order, status) {
    setPending((p) => ({ ...p, [order.id]: status }));
    try {
      await updateOrder(order.id, status);
      orders.reload();
    } catch (err) {
      console.error('Status update failed:', err);
      toast('Could not update this order. Please try again.', { tone: 'error' });
      setPending((p) => Object.fromEntries(Object.entries(p).filter(([id]) => id !== order.id)));
    }
  }

  const list = orders.data ?? [];
  const visibleOrders = useMemo(() => list.filter((order) => {
    const matchesQuery = `${order.id} ${order.customerName} ${order.customerEmail}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'all' || order.status === filter);
  }), [list, query, filter]);

  return (
    <div className="orders-page">
      <section className="page-intro"><div><span className="section-kicker">Admin menu</span><h1>Transaction editing</h1><p>Update the fulfilment status of each customer order. Every change is preserved in the order history.</p></div><div className="orders-count"><strong>{list.length}</strong><span>Total orders</span></div></section>

      <div className="orders-filterbar"><input aria-label="Search orders" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order or customer" /><div className="filter-pills">{['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status === 'all' ? 'All' : status}</button>)}</div></div>
      <div className="table-scroll"><table className="admin-table orders-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>City</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {!orders.loading && visibleOrders.length === 0 && <tr><td colSpan="7">No orders match this view.</td></tr>}
          {visibleOrders.map((o) => (
            <tr key={o.id}>
              <td>{shortOrderId(o.id)}</td>
              <td>{o.customerName}</td>
              <td>{o.items.length}</td>
              <td>{formatPrice(o.total)}</td>
              <td>{o.address ? o.address.city : ''}</td>
              <td>{formatDate(o.createdAt)}</td>
              <td>
                <select aria-label={`Status for order ${shortOrderId(o.id)}`} className="status-select" value={pending[o.id] ?? o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
