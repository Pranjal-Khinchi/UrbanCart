import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SEO from '../components/common/SEO';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popularity', label: 'Most Popular' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    const current = searchParams.get('search') || '';
    if (debouncedSearch !== current) {
      updateParam('search', debouncedSearch, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/products', { params: Object.fromEntries(searchParams) });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value, resetPage) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === undefined || value === null) next.delete(key);
    else next.set(key, value);
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const activeCategory = searchParams.get('category') || '';
  const activeSort = searchParams.get('sort') || 'newest';
  const currentPage = pagination.page || 1;

  return (
    <div className="container-page py-8">
      <SEO title="All Products" description="Browse UrbanCart's full catalog of electronics, fashion, home, beauty, and fitness products." />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
        <button onClick={() => setFiltersOpen(true)} className="btn-secondary lg:hidden">
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="input-field sm:max-w-sm"
          aria-label="Search products"
        />
        <select
          value={activeSort}
          onChange={(e) => updateParam('sort', e.target.value, false)}
          className="input-field sm:w-56"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <FilterPanel
            categories={categories}
            searchParams={searchParams}
            updateParam={updateParam}
            clearFilters={clearFilters}
            activeCategory={activeCategory}
          />
        </aside>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="relative ml-auto flex h-full w-80 max-w-full flex-col overflow-y-auto bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X size={20} />
                </button>
              </div>
              <FilterPanel
                categories={categories}
                searchParams={searchParams}
                updateParam={updateParam}
                clearFilters={clearFilters}
                activeCategory={activeCategory}
              />
              <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6">
                Show results
              </button>
            </div>
          </div>
        )}

        <div>
          {loading && <ProductGridSkeleton count={8} />}

          {!loading && error && <ErrorState message={error} onRetry={fetchProducts} />}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search term."
              actionLabel="Clear filters"
              actionTo="/products"
            />
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => updateParam('page', currentPage - 1, false)}
                    className="btn-secondary disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => updateParam('page', currentPage + 1, false)}
                    className="btn-secondary disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ categories, searchParams, updateParam, clearFilters, activeCategory }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Category</h3>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="radio"
              name="category"
              checked={!activeCategory}
              onChange={() => updateParam('category', '', true)}
            />
            All Categories
          </label>
          {categories.map((cat) => (
            <label key={cat._id} className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="category"
                checked={activeCategory === cat.slug}
                onChange={() => updateParam('category', cat.slug, true)}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            defaultValue={searchParams.get('minPrice') || ''}
            onBlur={(e) => updateParam('minPrice', e.target.value, true)}
            className="input-field"
            aria-label="Minimum price"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            defaultValue={searchParams.get('maxPrice') || ''}
            onBlur={(e) => updateParam('maxPrice', e.target.value, true)}
            className="input-field"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Minimum Rating</h3>
        <div className="flex gap-2">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => updateParam('minRating', searchParams.get('minRating') === String(r) ? '' : r, true)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                searchParams.get('minRating') === String(r)
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              {r}★+
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={searchParams.get('inStock') === 'true'}
            onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '', true)}
          />
          In stock only
        </label>
      </div>

      <button onClick={clearFilters} className="text-sm font-medium text-brand-600 hover:underline">
        Clear all filters
      </button>
    </div>
  );
}
