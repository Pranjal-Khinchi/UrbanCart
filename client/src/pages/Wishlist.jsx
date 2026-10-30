import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import SEO from '../components/common/SEO';

export default function Wishlist() {
  const { wishlist, toggleWishlist, moveToCart } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useToast();
  const products = wishlist.products || [];

  if (!user) {
    return (
      <div className="container-page py-12">
        <SEO title="Wishlist" />
        <EmptyState icon={Heart} title="Log in to view your wishlist" description="Save your favorite products to come back to them later." actionLabel="Log In" actionTo="/login" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container-page py-12">
        <SEO title="Wishlist" />
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart icon on any product to save it here." actionLabel="Browse Products" actionTo="/products" />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <SEO title="Wishlist" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Wishlist</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product._id} className="card flex gap-4 p-4">
            <Link to={`/products/${product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link to={`/products/${product.slug}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                  {product.name}
                </Link>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(product.price)}</p>
                {product.stock === 0 && <p className="text-xs font-medium text-red-600">Out of stock</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (product.stock === 0) return showToast(`${product.name} is out of stock`, 'error');
                    await moveToCart(product._id);
                  }}
                  className="btn-primary flex-1 !px-3 !py-1.5 text-xs"
                >
                  <ShoppingCart size={13} /> Move to Cart
                </button>
                <button
                  onClick={() => toggleWishlist(product._id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
