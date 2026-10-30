import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SEO from '../../components/common/SEO';

export default function AdminReviews() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/reviews', { params: { page, limit: 20 } });
      setReviews(data.data);
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
      await api.delete(`/reviews/${toDelete._id}`);
      showToast('Review deleted', 'success');
      setToDelete(null);
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <SEO title="Manage Reviews" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reviews</h1>

      {error && <ErrorState message={error} onRetry={() => load(pagination.page)} />}

      {!error && reviews.length === 0 && (
        <EmptyState title="No reviews yet" description="Customer reviews will appear here once submitted." />
      )}

      {!error && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="card flex items-start justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{r.user?.name}</span>
                  <span className="text-xs text-gray-400">on {r.product?.name}</span>
                </div>
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(r.createdAt)}</p>
              </div>
              <button onClick={() => setToDelete(r)} aria-label="Delete review" className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
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
        title="Delete this review?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
