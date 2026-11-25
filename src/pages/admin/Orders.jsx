import { useEffect, useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatDate, formatPrice, shortOrderId } from '../../lib/format';
import { getAdminOrders, updateOrder } from '../../lib/data';
import { toast } from '../../lib/toast';
import { EXPECTED_DELIVERY_DAYS, ORDER_STATUSES, ORDER_TRANSITIONS } from '../../../server/lib/validate.js';

const FILTERS = ['all', ...ORDER_STATUSES];

export default function Orders() {
  useDocumentTitle('Orders — Admin');

  const orders = useAsync(async () => getAdminOrders());
  const [saving, setSaving] = useState({});
  const [updatedStatuses, setUpdatedStatuses] = useState({});
  const [deliveryEstimates, setDeliveryEstimates] = useState({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!orders.data) return;
    const refreshedOrders = new Map(orders.data.map((order) => [order.id, order]));
    setUpdatedStatuses((current) => Object.fromEntries(
      Object.entries(current).filter(([id, status]) => refreshedOrders.get(id)?.status !== status),
    ));
    setDeliveryEstimates((current) => Object.fromEntries(
      Object.entries(current).filter(([id, estimate]) => (refreshedOrders.get(id)?.expectedDeliveryDays ?? null) !== estimate.days),
    ));
  }, [orders.data]);

  async function changeStatus(order, status) {
    setSaving((current) => ({ ...current, [order.id]: 'status' }));
    try {
      const updated = await updateOrder(order.id, { status });
      setUpdatedStatuses((current) => ({ ...current, [order.id]: updated.status }));
      orders.reload();
      toast(`Order status updated to ${status}.`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast('Could not update this order. Please try again.', { tone: 'error' });
    } finally {
      setSaving((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== order.id)));
    }
  }

  async function changeDeliveryEstimate(order, value) {
    const expectedDeliveryDays = value === '' ? null : Number(value);
    setSaving((current) => ({ ...current, [order.id]: 'delivery' }));
    try {
      const updated = await updateOrder(order.id, { expectedDeliveryDays });
      setDeliveryEstimates((current) => ({
        ...current,
        [order.id]: { days: updated.expectedDeliveryDays ?? null, at: updated.expectedDeliveryAt ?? null },
      }));
      orders.reload();
      toast(expectedDeliveryDays === null ? 'Delivery estimate cleared.' : 'Delivery estimate updated.');
    } catch (err) {
      console.error('Delivery estimate update failed:', err);
      toast('Could not update the delivery estimate. Please try again.', { tone: 'error' });
    } finally {
      setSaving((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== order.id)));
    }
  }

  const list = orders.data ?? [];
  const visibleOrders = useMemo(() => list.filter((order) => {
    const matchesQuery = `${order.id} ${order.customerName} ${order.customerEmail} ${order.address?.city || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'all' || (updatedStatuses[order.id] ?? order.status) === filter);
  }), [list, query, filter, updatedStatuses]);

  return (
    <div className="orders-page">
      <section className="page-intro orders-intro">
        <div>
          <span className="section-kicker">Shop admin / fulfilment</span>
          <h1>Orders</h1>
          <p>Update progress and set a delivery estimate for each customer.</p>
        </div>
        <div className="orders-count"><strong>{list.length}</strong><span>orders</span></div>
      </section>

      <div className="orders-filterbar orders-toolbar">
        <label className="orders-search">
          <span className="sr-only">Search orders</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order, customer or city" />
        </label>
        <div className="filter-pills" role="group" aria-label="Filter orders by status">
          {FILTERS.map((status) => (
            <button key={status} type="button" className={filter === status ? 'active' : ''} aria-pressed={filter === status} onClick={() => setFilter(status)}>
              {status === 'all' ? 'All orders' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-list" aria-live="polite">
        {!orders.loading && visibleOrders.length === 0 && (
          <div className="orders-empty">
            <span className="orders-empty-mark" aria-hidden="true">✦</span>
            <h2>{query || filter !== 'all' ? 'No matching orders' : 'No orders yet'}</h2>
            <p>{query || filter !== 'all' ? 'Try another search or status filter.' : 'New customer orders will appear here.'}</p>
          </div>
        )}
        {visibleOrders.map((order) => {
          const currentStatus = updatedStatuses[order.id] ?? order.status;
          const hasEstimateOverride = Object.hasOwn(deliveryEstimates, order.id);
          const currentEstimate = hasEstimateOverride ? deliveryEstimates[order.id] : null;
          const expectedDays = hasEstimateOverride ? currentEstimate.days : (order.expectedDeliveryDays ?? '');
          const expectedDeliveryAt = hasEstimateOverride ? currentEstimate.at : order.expectedDeliveryAt;
          const customerInitial = order.customerName?.trim()?.[0]?.toUpperCase() || '?';

          return (
            <article className="admin-order-card" key={order.id}>
              <header className="admin-order-card-head">
                <div className="admin-order-reference">
                  <span className="admin-order-avatar" aria-hidden="true">{customerInitial}</span>
                  <div>
                    <span className="admin-order-id">Order {shortOrderId(order.id)}</span>
                    <span className="admin-order-date">Placed {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <span className={`admin-order-badge status-${currentStatus.toLowerCase()}`}>{currentStatus}</span>
              </header>

              <div className="admin-order-details">
                <div className="admin-order-customer">
                  <span className="admin-order-label">Customer</span>
                  <strong>{order.customerName}</strong>
                  <span>{order.customerEmail}</span>
                </div>
                <div>
                  <span className="admin-order-label">Items</span>
                  <strong>{order.items?.length ?? 0} {order.items?.length === 1 ? 'piece' : 'pieces'}</strong>
                  <span>{(order.items || []).map((item) => item.name).join(', ')}</span>
                </div>
                <div>
                  <span className="admin-order-label">Deliver to</span>
                  <strong>{order.address?.city || '—'}</strong>
                  <span>{order.address?.street || 'Address not available'}</span>
                </div>
                <div className="admin-order-total">
                  <span className="admin-order-label">Order total</span>
                  <strong>{formatPrice(order.total)}</strong>
                  <span>{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Bank transfer'}</span>
                </div>
              </div>

              <footer className="admin-order-controls">
                <label>
                  <span>Order status</span>
                  <select
                    className="status-select"
                    aria-label={`Status for order ${shortOrderId(order.id)}`}
                    value={currentStatus}
                    disabled={Boolean(saving[order.id])}
                    onChange={(event) => changeStatus(order, event.target.value)}
                  >
                    {[currentStatus, ...(ORDER_TRANSITIONS[currentStatus] || [])].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  <span>Expected delivery</span>
                  <select
                    className="delivery-estimate-select"
                    aria-label={`Expected delivery for order ${shortOrderId(order.id)}`}
                    value={expectedDays ?? ''}
                    disabled={Boolean(saving[order.id]) || ['Delivered', 'Cancelled'].includes(currentStatus)}
                    onChange={(event) => changeDeliveryEstimate(order, event.target.value)}
                  >
                    <option value="">Not set</option>
                    {EXPECTED_DELIVERY_DAYS.map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}
                  </select>
                </label>
                <p className="admin-order-eta">
                  {expectedDeliveryAt && expectedDays !== '' && expectedDays !== null
                    ? `Customer estimate: ${formatDate(expectedDeliveryAt)}`
                    : 'Customers will see the estimate in their order details.'}
                </p>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
