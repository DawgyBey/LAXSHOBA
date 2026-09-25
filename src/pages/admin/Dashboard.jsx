import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getAdminDashboard } from '../../lib/data';
import { formatPrice, shortOrderId } from '../../lib/format';

const LOW_STOCK_AT = 3;

export default function Dashboard() {
  useDocumentTitle('Dashboard — Admin');

  const { data, loading } = useAsync(async () => {
    return getAdminDashboard();
  });

  const products = data?.products ?? [];
  const orders = data?.orders ?? [];
  const show = (value) => (data ? value : '—');

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStock = products.filter((p) => (p.stock || 0) <= LOW_STOCK_AT).length;
  const recent = orders.slice(0, 6);

  return (
    <>
      <div className="admin-topbar"><h1>Dashboard</h1></div>

      <div className="stat-cards">
        <div className="stat-card"><div className="label">Total Orders</div><div className="value">{show(orders.length)}</div></div>
        <div className="stat-card"><div className="label">Total Sales</div><div className="value">{show(formatPrice(totalSales))}</div></div>
        <div className="stat-card"><div className="label">Products</div><div className="value">{show(products.length)}</div></div>
        <div className="stat-card"><div className="label">Low Stock</div><div className="value">{show(lowStock)}</div></div>
      </div>

      <div className="admin-panel-box">
        <h3>Recent Orders</h3>
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {!loading && recent.length === 0 && <tr><td colSpan="4">No orders yet.</td></tr>}
            {recent.map((o) => (
              <tr key={o.id}>
                <td>{shortOrderId(o.id)}</td>
                <td>{o.customerName}</td>
                <td>{formatPrice(o.total)}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
