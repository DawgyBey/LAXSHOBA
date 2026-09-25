import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { ORDER_STATUSES } from '../../lib/constants';
import { getAdminOrders, updateOrder } from '../../lib/data';
import { formatDate, formatPrice, shortOrderId } from '../../lib/format';

export default function Orders() {
  useDocumentTitle('Orders — Admin');

  const orders = useAsync(async () =>
    getAdminOrders());
  // Statuses the admin has just changed, shown immediately (and kept once saved).
  const [pending, setPending] = useState({});

  async function changeStatus(order, status) {
    setPending((p) => ({ ...p, [order.id]: status }));
    try {
      await updateOrder(order.id, status);
      orders.reload();
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Could not update this order. Please try again.');
      // Drop the optimistic value so the dropdown shows the real status again.
      setPending((p) => Object.fromEntries(Object.entries(p).filter(([id]) => id !== order.id)));
    }
  }

  const list = orders.data ?? [];

  return (
    <>
      <div className="admin-topbar"><h1>Orders</h1></div>

      <div className="admin-panel-box">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>City</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {!orders.loading && list.length === 0 && <tr><td colSpan="7">No orders yet.</td></tr>}
            {list.map((o) => (
              <tr key={o.id}>
                <td>{shortOrderId(o.id)}</td>
                <td>{o.customerName}</td>
                <td>{o.items.length}</td>
                <td>{formatPrice(o.total)}</td>
                <td>{o.address ? o.address.city : ''}</td>
                <td>{formatDate(o.createdAt)}</td>
                <td>
                  <select className="status-select" value={pending[o.id] ?? o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
