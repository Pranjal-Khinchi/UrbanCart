import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import SEO from '../../components/common/SEO';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

export default function AdminOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders', {
        params: { all: 'true', page, limit: 15, search: search || undefined, status: statusFilter || undefined },
      });
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (orderId, field, value) => {
    try {
      await api.put(`/orders/${orderId}/status`, { [field]: value });
      showToast('Order updated', 'success');
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <SEO title="Manage Orders" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); load(1); }} className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer name or email" className="input-field sm:w-72" />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-52">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <PageLoader />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(pagination.page)} />}

      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">#{o._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{o.user?.name}</p>
                    <p className="text-xs text-gray-400">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateStatus(o._id, 'orderStatus', e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.paymentStatus}
                      onChange={(e) => updateStatus(o._id, 'paymentStatus', e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    >
                      {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/orders/${o._id}`} className="text-xs font-medium text-brand-600 hover:underline">Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn-secondary disabled:opacity-40">Previous</button>
          <span className="self-center text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} className="btn-secondary disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
