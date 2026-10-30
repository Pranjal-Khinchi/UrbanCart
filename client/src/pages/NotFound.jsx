import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <SEO title="Page Not Found" />
      <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
      <p className="mt-3 text-lg font-semibold text-gray-900">Page not found</p>
      <p className="mt-1 text-sm text-gray-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to Home</Link>
    </div>
  );
}
