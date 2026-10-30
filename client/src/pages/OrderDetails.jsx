import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';
import PageLoader from '../components/common/PageLoader';
import ErrorState from '../components/common/ErrorState';
import StatusBadge from '../components/common/StatusBadge';
import SEO from '../components/common/SEO';

const TIMELINE = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <PageLoader />;
  if (error || !order) return <div className="container-page py-12"><ErrorState message={error || 'Order not found.'} /></div>;

  const isCancelled = order.orderStatus === 'Cancelled';
  const currentIndex = TIMELINE.indexOf(order.orderStatus);

  return (
    <div className="container-page max-w-3xl py-8">
      <SEO title={`Order #${order._id.slice(-8).toUpperCase()}`} />
      <Link to="/orders" className="text-sm font-medium text-brand-600 hover:underline">← Back to orders</Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.orderStatus} type="order" />
          <StatusBadge status={order.paymentStatus} type="payment" />
        </div>
      </div>

      {/* Timeline */}
      <div className="card mt-6 p-6">
        {isCancelled ? (
          <p className="text-sm font-medium text-red-600">This order has been cancelled.</p>
        ) : (
          <ol className="flex flex-wrap items-center gap-y-4">
            {TIMELINE.map((step, i) => (
              <li key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      i <= currentIndex ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i <= currentIndex ? <CheckCircle2 size={16} /> : i + 1}
                  </span>
                  <span className="text-xs text-gray-600">{step}</span>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 ${i < currentIndex ? 'bg-brand-600' : 'bg-gray-200'}`} />
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Items */}
      <div className="card mt-6 divide-y divide-gray-100 p-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
            </div>
            <span className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Summary + address */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Order Summary</h3>
          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-1.5 text-sm font-bold text-gray-900"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Payment method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Test Payment (Demo)'}
          </p>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.fullName}<br />
            {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}<br />
            {order.shippingAddress.phone}
          </p>
        </div>
      </div>
    </div>
  );
}
