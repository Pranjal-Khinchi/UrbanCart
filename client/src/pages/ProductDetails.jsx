import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Heart, Minus, Plus, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/product/ProductCard';
import PageLoader from '../components/common/PageLoader';
import ErrorState from '../components/common/ErrorState';
import SEO from '../components/common/SEO';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/products/${slug}`);
      setProduct(data.data.product);
      setRelated(data.data.related);
      setActiveImage(0);
      setQuantity(1);
      const reviewRes = await api.get(`/products/${data.data.product._id}/reviews`);
      setReviews(reviewRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  if (loading) return <PageLoader />;
  if (error || !product) return <div className="container-page py-12"><ErrorState message={error || 'Product not found.'} onRetry={load} /></div>;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAddToCart = async () => {
    if (!user) return showToast('Please log in to add items to your cart', 'info');
    await addToCart(product._id, quantity);
  };

  const handleBuyNow = async () => {
    if (!user) return showToast('Please log in to continue', 'info');
    const result = await addToCart(product._id, quantity);
    if (result?.success !== false) navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return showToast('Please log in to write a review', 'info');
    setSubmittingReview(true);
    try {
      await api.post(`/products/${product._id}/reviews`, reviewForm);
      showToast('Thanks for your review!', 'success');
      setReviewForm({ rating: 5, comment: '' });
      const reviewRes = await api.get(`/products/${product._id}/reviews`);
      setReviews(reviewRes.data.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container-page py-8">
      <SEO title={product.name} description={product.description?.slice(0, 150)} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
            <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    activeImage === i ? 'border-brand-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link to={`/products?category=${product.category?.slug}`} className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {product.category?.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-900">{product.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span>({product.reviewCount || 0} reviews)</span>
            <span className="text-gray-300">•</span>
            <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.stock > 0 ? `In stock (${product.stock} left)` : 'Out of stock'}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                <span className="rounded-md bg-accent-500/10 px-2 py-0.5 text-sm font-semibold text-accent-600">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-gray-600">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center text-gray-600 disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="flex h-10 w-10 items-center justify-center text-gray-600 disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => toggleWishlist(product._id)}
              aria-pressed={isWishlisted(product._id)}
              aria-label="Toggle wishlist"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
            >
              <Heart size={18} className={isWishlisted(product._id) ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleAddToCart} disabled={product.stock === 0} className="btn-secondary flex-1 py-3">
              Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="btn-primary flex-1 py-3">
              Buy Now
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Truck size={16} className="text-brand-600" /> Free shipping above ₹999
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <RotateCcw size={16} className="text-brand-600" /> 7-day easy returns
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ShieldCheck size={16} className="text-brand-600" /> Secure checkout
            </div>
          </div>

          {product.specifications?.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Specifications</h3>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {product.specifications.map((spec) => (
                  <div key={spec.key} className="flex justify-between border-b border-gray-100 py-1.5">
                    <dt className="text-gray-500">{spec.key}</dt>
                    <dd className="font-medium text-gray-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-gray-200 pt-10">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Customer Reviews</h2>

        <form onSubmit={handleReviewSubmit} className="card mb-8 max-w-xl p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Write a review</h3>
          <div className="mb-3 flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reviewForm.rating === r}
                onClick={() => setReviewForm((f) => ({ ...f, rating: r }))}
                aria-label={`${r} star`}
              >
                <Star size={22} className={r <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <label htmlFor="review-comment" className="sr-only">Your review</label>
          <textarea
            id="review-comment"
            required
            rows={3}
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Share your thoughts about this product..."
            className="input-field"
          />
          <button type="submit" disabled={submittingReview} className="btn-primary mt-3">
            {submittingReview ? 'Submitting...' : 'Submit review'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r._id} className="border-b border-gray-100 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{r.user?.name || 'Anonymous'}</span>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
