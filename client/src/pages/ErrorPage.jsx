import { Link, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-extrabold text-red-500">Something went wrong</h1>
      <p className="mt-3 text-sm text-gray-500">{error?.statusText || error?.message || 'An unexpected error occurred.'}</p>
      <Link to="/" className="btn-primary mt-6">Back to Home</Link>
    </div>
  );
}
