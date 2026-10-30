const ORDER_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const PAYMENT_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Paid: 'bg-green-50 text-green-700 border-green-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
  Refunded: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function StatusBadge({ status, type = 'order' }) {
  const styles = type === 'order' ? ORDER_STYLES : PAYMENT_STYLES;
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}
