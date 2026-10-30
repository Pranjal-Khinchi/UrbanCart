import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import SEO from '../../components/common/SEO';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users', { params: { page, limit: 15, search: search || undefined } });
      setUsers(data.data);
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
  }, []);

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      showToast('User role updated', 'success');
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const changeStatus = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive });
      showToast(isActive ? 'User activated' : 'User deactivated', 'success');
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <SEO title="Manage Users" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Users</h1>

      <form onSubmit={(e) => { e.preventDefault(); load(1); }} className="mb-4 flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="input-field sm:w-72" />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {loading && <PageLoader />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(pagination.page)} />}

      {!loading && !error && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isSelf = u._id === currentUser._id;
                return (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name} {isSelf && <span className="text-xs text-gray-400">(you)</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => changeRole(u._id, e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={isSelf}
                        onClick={() => changeStatus(u._id, !u.isActive)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                          u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                  </tr>
                );
              })}
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
