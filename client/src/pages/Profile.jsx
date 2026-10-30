import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { getErrorMessage } from '../services/api';
import SEO from '../components/common/SEO';

const emptyAddress = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' };

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();

  const [personal, setPersonal] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const savePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', personal);
      updateLocalUser(data.data);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    const required = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'];
    if (required.some((f) => !newAddress[f]?.trim())) {
      showToast('Please fill all required address fields', 'error');
      return;
    }
    const next = [...addresses, newAddress];
    try {
      const { data } = await api.put('/users/me', { addresses: next });
      setAddresses(data.data.addresses);
      updateLocalUser(data.data);
      setNewAddress(emptyAddress);
      setShowAddForm(false);
      showToast('Address added', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const removeAddress = async (index) => {
    const next = addresses.filter((_, i) => i !== index);
    try {
      const { data } = await api.put('/users/me', { addresses: next });
      setAddresses(data.data.addresses);
      updateLocalUser(data.data);
      showToast('Address removed', 'info');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="container-page max-w-3xl py-8">
      <SEO title="My Profile" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Profile</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/orders" className="btn-secondary">My Orders</Link>
        <Link to="/wishlist" className="btn-secondary">My Wishlist</Link>
      </div>

      {/* Personal information */}
      <section className="card mb-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
        <form onSubmit={savePersonal} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={user?.email} disabled className="input-field bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input type="text" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Addresses */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
          <button onClick={() => setShowAddForm((v) => !v)} className="btn-secondary text-xs">
            <Plus size={14} /> Add Address
          </button>
        </div>

        {addresses.length === 0 && !showAddForm && (
          <p className="text-sm text-gray-500">No saved addresses yet.</p>
        )}

        <div className="space-y-3">
          {addresses.map((addr, i) => (
            <div key={i} className="flex items-start justify-between rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{addr.label} — {addr.fullName}</p>
                <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}</p>
                <p>{addr.phone}</p>
              </div>
              <button onClick={() => removeAddress(i)} aria-label="Remove address" className="text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {showAddForm && (
          <form onSubmit={addAddress} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
            <input placeholder="Label (e.g. Home)" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} className="input-field" />
            <input placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="input-field" />
            <input placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="input-field" />
            <input placeholder="Address Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="input-field sm:col-span-2" />
            <input placeholder="Address Line 2 (optional)" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} className="input-field sm:col-span-2" />
            <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="input-field" />
            <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="input-field" />
            <input placeholder="Postal Code" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} className="input-field" />
            <input placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="input-field" />
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">Save Address</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
