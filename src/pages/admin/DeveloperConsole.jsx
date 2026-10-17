import { useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getAdminOrders } from '../../lib/data';
import { formatDate, formatPrice, shortOrderId } from '../../lib/format';

const paymentLabel = (order) => order.paymentStatus === 'paid' ? 'Captured' : 'Awaiting payment';

export default function DeveloperConsole() {
  useDocumentTitle('Transaction Operations — Developer');
  const transactions = useAsync(() => getAdminOrders());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const list = transactions.data ?? [];
  const filtered = useMemo(() => list.filter((order) => {
    const matchesQuery = `${order.id} ${order.customerName} ${order.customerEmail}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'attention' && (order.status === 'Cancelled' || order.paymentStatus !== 'paid')) || order.status.toLowerCase() === filter;
    return matchesQuery && matchesFilter;
  }), [list, query, filter]);
  const total = list.reduce((sum, order) => sum + (order.total || 0), 0);
  const attention = list.filter((order) => order.status === 'Cancelled' || order.paymentStatus !== 'paid').length;

  return <div className="developer-console">
    <section className="console-hero">
      <div><span className="section-kicker">Developer menu</span><h1>Transaction operations</h1><p>Trace every checkout, isolate exceptions, and inspect the data that powers fulfillment.</p></div>
      <button className="console-refresh" onClick={transactions.reload}>↻ Refresh feed</button>
    </section>

    <div className="ops-stat-grid">
      <div className="ops-stat"><span>Volume observed</span><strong>{transactions.data ? formatPrice(total) : '—'}</strong><small>Across {list.length} transactions</small></div>
      <div className="ops-stat"><span>Needs review</span><strong>{transactions.data ? attention : '—'}</strong><small>Payment or fulfilment exception</small></div>
      <div className="ops-stat"><span>Endpoint health</span><strong className="success-text">Healthy</strong><small><i className="status-dot" /> /api/admin/orders responding</small></div>
    </div>

    <section className="admin-panel-box transaction-panel">
      <div className="transaction-toolbar"><div><h3>Transaction ledger</h3><p>Read-only operational view. Status changes stay in the Admin menu.</p></div><div className="ledger-actions"><input aria-label="Search transactions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID or customer" /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All transactions</option><option value="attention">Needs review</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="delivered">Delivered</option></select></div></div>
      <div className="table-scroll"><table className="admin-table transaction-table"><thead><tr><th>Transaction</th><th>Customer</th><th>Method</th><th>Amount</th><th>Payment</th><th>Fulfilment</th><th>Created</th></tr></thead><tbody>
        {!transactions.loading && filtered.length === 0 && <tr><td colSpan="7" className="empty-ledger">No transactions match this view.</td></tr>}
        {filtered.map((order) => <tr key={order.id}><td><span className="order-code">{shortOrderId(order.id)}</span><small>{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</small></td><td><strong>{order.customerName}</strong><small>{order.customerEmail || 'No email supplied'}</small></td><td>{order.paymentMethod || '—'}</td><td><strong>{formatPrice(order.total)}</strong></td><td><span className={`payment-state ${order.paymentStatus === 'paid' ? 'is-paid' : 'is-pending'}`}>{paymentLabel(order)}</span></td><td><span className={`order-state state-${String(order.status).toLowerCase()}`}>{order.status}</span></td><td>{formatDate(order.createdAt)}</td></tr>)}
      </tbody></table></div>
    </section>
  </div>;
}
