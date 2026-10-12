import { useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatDate, formatPrice, shortOrderId } from '../../lib/format';
import { getAdminOrders, updateOrder } from '../../lib/data';

export default function Orders() {
  useDocumentTitle('Orders — Admin');

  const orders = useAsync(async () => getAdminOrders());
  const [pending, setPending] = useState({});

  async function changeStatus(order, status) {
    setPending((p) => ({ ...p, [order.id]: status }));
    try {
      await updateOrder(order.id, status);
      orders.reload();
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Could not update this order. Please try again.');
      setPending((p) => Object.fromEntries(Object.entries(p).filter(([id]) => id !== order.id)));
    }
  }

  const list = orders.data ?? [];

  return (
    <div>
      <h1>Orders</h1>

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
      </table>
    </div>
  );
}