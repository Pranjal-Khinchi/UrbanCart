import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please log in to add items to your cart', 'info');
      return;
    }
    addToCart(product._id, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
      <Link
        to={`/products/${product.slug}`}
        className="group card flex h-full flex-col overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.images?.[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute left-2 top-2 rounded-md bg-accent-500 px-2 py-1 text-xs font-semibold text-white">
              -{discount}%
            </span>
          )}
          <button
            onClick={handleWishlist}
            aria-label={isWishlisted(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted(product._id)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
          >
            <Heart
              size={16}
              className={isWishlisted(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}
            />
          </button>
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="rounded-md bg-gray-900 px-3 py-1 text-xs font-semibold text-white">Out of stock</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3.5">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {product.category?.name}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</h3>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{product.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-300">•</span>
            <span>{product.reviewCount || 0} reviews</span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <ShoppingCart size={15} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
