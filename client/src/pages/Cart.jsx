import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';
import SEO from '../components/common/SEO';

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 79;

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const items = cart.items || [];

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (loading) return <PageLoader />;

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <SEO title="Your Cart" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Start exploring our products."
          actionLabel="Continue Shopping"
          actionTo="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <SEO title="Your Cart" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const lineTotal = product.price * item.quantity;
            return (
              <div key={item._id} className="card flex gap-4 p-4">
                <Link to={`/products/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link to={`/products/${product.slug}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                        {product.name}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">{formatPrice(product.price)} each</p>
                      {item.quantity > product.stock && (
                        <p className="mt-1 text-xs font-medium text-red-600">Only {product.stock} left in stock</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="h-fit text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center text-gray-600 disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, Math.min(product.stock, item.quantity + 1))}
                        disabled={item.quantity >= product.stock}
                        className="flex h-8 w-8 items-center justify-center text-gray-600 disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(lineTotal)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <Link to="/products" className="inline-block text-sm font-medium text-brand-600 hover:underline">
            ← Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-{formatPrice(0)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <p className="mt-3 text-xs text-gray-500">
              Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.
            </p>
          )}
          <Link to="/checkout" className="btn-primary mt-5 w-full">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
