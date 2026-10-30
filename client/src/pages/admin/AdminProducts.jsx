import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SEO from '../../components/common/SEO';

export default function AdminProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/products', { params: { page, limit: 20, sort: 'newest' } });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${toDelete._id}`);
      showToast('Product deleted', 'success');
      setToDelete(null);
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <SEO title="Manage Products" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus size={16} /> New Product
        </Link>
      </div>

      {loading && <PageLoader />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(pagination.page)} />}
      {!loading && !error && products.length === 0 && (
        <EmptyState title="No products yet" description="Create your first product to get started." actionLabel="New Product" actionTo="/admin/products/new" />
      )}

      {!loading && !error && products.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="flex items-center gap-3 px-4 py-3">
                    <img src={p.images?.[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3 text-gray-900">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? 'font-semibold text-red-600' : 'text-gray-600'}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">{p.featured ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/products/${p._id}/edit`} aria-label={`Edit ${p.name}`} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
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

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete "${toDelete?.name}"?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
