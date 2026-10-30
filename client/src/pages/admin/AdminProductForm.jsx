import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageLoader from '../../components/common/PageLoader';
import SEO from '../../components/common/SEO';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  category: '',
  brand: '',
  images: [''],
  stock: '',
  tags: '',
  featured: false,
  specifications: [{ key: '', value: '' }],
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  // Fetch the single product by id — the public API only looks up by slug,
  // so admin edit uses this dedicated by-id endpoint instead.
  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/products/id/${id}`);
        const found = data.data;
        setForm({
          name: found.name,
          description: found.description,
          price: found.price,
          originalPrice: found.originalPrice || '',
          category: found.category?._id || '',
          brand: found.brand,
          images: found.images?.length ? found.images : [''],
          stock: found.stock,
          tags: (found.tags || []).join(', '),
          featured: found.featured,
          specifications: found.specifications?.length ? found.specifications : [{ key: '', value: '' }],
        });
      } catch (err) {
        setError(getErrorMessage(err) || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEdit]);

  const handleImageChange = (i, value) => {
    const next = [...form.images];
    next[i] = value;
    setForm({ ...form, images: next });
  };

  const addImageField = () => setForm({ ...form, images: [...form.images, ''] });
  const removeImageField = (i) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });

  const handleSpecChange = (i, field, value) => {
    const next = [...form.specifications];
    next[i][field] = value;
    setForm({ ...form, specifications: next });
  };
  const addSpecField = () => setForm({ ...form, specifications: [...form.specifications, { key: '', value: '' }] });
  const removeSpecField = (i) => setForm({ ...form, specifications: form.specifications.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        category: form.category,
        brand: form.brand,
        images: form.images.filter((img) => img.trim()),
        stock: Number(form.stock),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured: form.featured,
        specifications: form.specifications.filter((s) => s.key.trim() && s.value.trim()),
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        showToast('Product updated', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product created', 'success');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl">
      <SEO title={isEdit ? 'Edit Product' : 'New Product'} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
          <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹) *</label>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Original Price (₹)</label>
            <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Brand</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Stock *</label>
          <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tags (comma separated)</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="wireless, audio, headphones" />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured product
          </label>
        </div>

        {/* Images */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Image URLs *</label>
          <div className="space-y-2">
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input value={img} onChange={(e) => handleImageChange(i, e.target.value)} className="input-field" placeholder="https://..." />
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImageField(i)} className="rounded-lg p-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addImageField} className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-600">
            <Plus size={13} /> Add another image
          </button>
        </div>

        {/* Specifications */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Specifications</label>
          <div className="space-y-2">
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Key (e.g. Weight)" value={spec.key} onChange={(e) => handleSpecChange(i, 'key', e.target.value)} className="input-field" />
                <input placeholder="Value (e.g. 250g)" value={spec.value} onChange={(e) => handleSpecChange(i, 'value', e.target.value)} className="input-field" />
                <button type="button" onClick={() => removeSpecField(i)} className="rounded-lg p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSpecField} className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-600">
            <Plus size={13} /> Add specification
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
