import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { getErrorMessage } from '../services/api';
import { formatPrice } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import SEO from '../components/common/SEO';

const STEPS = ['Shipping Address', 'Order Review', 'Payment', 'Confirmation'];
const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 79;

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' };

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ ...emptyAddress, fullName: user?.name || '', phone: user?.phone || '' });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);

  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingFeeEstimate = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;

  if (items.length === 0 && !order) {
    return (
      <div className="container-page py-12">
        <SEO title="Checkout" />
        <EmptyState title="Your cart is empty" description="Add some products before checking out." actionLabel="Browse Products" actionTo="/products" />
      </div>
    );
  }

  const validateAddress = () => {
    const required = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'];
    const next = {};
    required.forEach((field) => {
      if (!address[field]?.trim()) next[field] = 'Required';
    });
    if (address.phone && !/^\+?[0-9\s-]{7,15}$/.test(address.phone)) next.phone = 'Enter a valid phone number';
    if (address.postalCode && !/^[0-9A-Za-z\s-]{4,10}$/.test(address.postalCode)) next.postalCode = 'Enter a valid postal code';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const placeOrder = async () => {
    setPlacing(true);
    try {
      // Only address + payment method are sent — pricing is calculated
      // entirely server-side from the live database, never trusted from here.
      const { data } = await api.post('/orders', { shippingAddress: address, paymentMethod });
      setOrder(data.data);
      setStep(3);
      await refreshCart();
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-8">
      <SEO title="Checkout" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>

      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 font-medium ${i <= step ? 'text-brand-600' : 'text-gray-400'}`}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                i <= step ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={address.fullName} error={errors.fullName} onChange={(v) => setAddress({ ...address, fullName: v })} />
            <Field label="Phone Number" value={address.phone} error={errors.phone} onChange={(v) => setAddress({ ...address, phone: v })} />
            <Field className="sm:col-span-2" label="Address Line 1" value={address.line1} error={errors.line1} onChange={(v) => setAddress({ ...address, line1: v })} />
            <Field className="sm:col-span-2" label="Address Line 2 (optional)" value={address.line2} onChange={(v) => setAddress({ ...address, line2: v })} />
            <Field label="City" value={address.city} error={errors.city} onChange={(v) => setAddress({ ...address, city: v })} />
            <Field label="State" value={address.state} error={errors.state} onChange={(v) => setAddress({ ...address, state: v })} />
            <Field label="Postal Code" value={address.postalCode} error={errors.postalCode} onChange={(v) => setAddress({ ...address, postalCode: v })} />
            <Field label="Country" value={address.country} onChange={(v) => setAddress({ ...address, country: v })} />
          </div>
          <div className="flex justify-end">
            <button onClick={goNext} className="btn-primary">Continue to Review</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Order Review</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.product?.name} × {item.quantity}</span>
                <span className="font-medium text-gray-900">{formatPrice((item.product?.price || 0) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal (estimate)</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping (estimate)</span><span>{shippingFeeEstimate === 0 ? 'Free' : formatPrice(shippingFeeEstimate)}</span></div>
            <p className="mt-2 text-xs text-gray-400">Final totals are calculated securely on the server at checkout.</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900">Shipping to:</p>
            <p>{address.fullName}, {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}</p>
            <p>{address.phone}</p>
          </div>
          <div className="flex justify-between">
            <button onClick={goBack} className="btn-secondary">Back</button>
            <button onClick={goNext} className="btn-primary">Continue to Payment</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
          <div className="space-y-3">
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${paymentMethod === 'COD' ? 'border-brand-600 bg-brand-50' : 'border-gray-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="mt-1" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Cash on Delivery</span>
                <span className="block text-xs text-gray-500">Pay in cash when your order arrives.</span>
              </span>
            </label>
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${paymentMethod === 'TEST_PAYMENT' ? 'border-brand-600 bg-brand-50' : 'border-gray-300'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'TEST_PAYMENT'} onChange={() => setPaymentMethod('TEST_PAYMENT')} className="mt-1" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Test Payment (Demo)</span>
                <span className="block text-xs text-gray-500">
                  Simulated payment for demo purposes only — no real card details are collected or processed.
                </span>
              </span>
            </label>
          </div>
          <div className="flex justify-between">
            <button onClick={goBack} className="btn-secondary">Back</button>
            <button onClick={placeOrder} disabled={placing} className="btn-primary">
              {placing ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && order && (
        <div className="card flex flex-col items-center p-10 text-center">
          <CheckCircle2 size={48} className="mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h2>
          <p className="mt-2 text-sm text-gray-500">Order ID: {order._id}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{formatPrice(order.total)}</p>
          <div className="mt-6 flex gap-3">
            <Link to={`/orders/${order._id}`} className="btn-primary">View Order</Link>
            <Link to="/products" className="btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, error, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? 'border-red-400' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
