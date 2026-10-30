import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import SEO from '../../components/common/SEO';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.data);
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
  if (error) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Low Stock Products', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div>
      <SEO title="Admin Dashboard" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{o.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.orderStatus} />
                    <span className="font-semibold text-gray-900">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status overview */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Order Status Overview</h2>
          <div className="space-y-2">
            {Object.entries(stats.orderStatusOverview).length === 0 && (
              <p className="text-sm text-gray-500">No orders yet.</p>
            )}
            {Object.entries(stats.orderStatusOverview).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status} />
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Low Stock Products</h2>
            <Link to="/admin/products" className="text-xs font-medium text-brand-600 hover:underline">Manage</Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="font-semibold text-red-600">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className="text-xs uppercase text-gray-400">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
