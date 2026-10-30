import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';
import PageLoader from '../components/common/PageLoader';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SEO from '../components/common/SEO';
import StatusBadge from '../components/common/StatusBadge';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders');
      setOrders(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="container-page py-8">
      <SEO title="My Orders" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Orders</h1>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && orders.length === 0 && (
        <EmptyState icon={Package} title="No orders yet" description="Once you place an order, it will show up here." actionLabel="Start Shopping" actionTo="/products" />
      )}

      {!error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="card flex flex-col gap-3 p-4 hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-500">{formatDate(order.createdAt)} · {order.items.length} item(s)</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={order.orderStatus} />
                <span className="text-sm font-semibold text-gray-900">{formatPrice(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
