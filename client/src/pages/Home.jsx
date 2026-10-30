import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RotateCcw, Headphones, ArrowRight, Star } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import SEO from '../components/common/SEO';

const WHY_CHOOSE = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Free shipping on orders above ₹999, delivered reliably.' },
  { icon: ShieldCheck, title: 'Secure Checkout', desc: 'Your data and payments are always protected.' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free returns on eligible items.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Our team is here whenever you need help.' },
];

const TESTIMONIALS = [
  { name: 'Aarav Mehta', text: 'Great quality products and the checkout was smooth. Delivery was faster than expected.' },
  { name: 'Simran Kaur', text: 'Loved the range of categories. Found exactly what I needed at a good price.' },
  { name: 'Rohan Gupta', text: 'Customer support helped me resolve an order issue within minutes. Very impressed.' },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [catRes, featRes, trendRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured'),
          api.get('/products?sort=popularity&limit=8'),
        ]);
        setCategories(catRes.data.data);
        setFeatured(featRes.data.data);
        setTrending(trendRes.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <SEO description="Shop electronics, fashion, home essentials, beauty, fitness gear and more — all in one better place." />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              New season arrivals
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
              Everything you need. <span className="text-brand-600">One better place.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-gray-600">
              Discover electronics, fashion, home essentials, beauty, and fitness gear — curated for quality and priced fairly.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary px-6 py-3 text-base">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link to="/products?sort=newest" className="btn-secondary px-6 py-3 text-base">
                Explore New Arrivals
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <img
              src="https://picsum.photos/seed/urbancart-hero/900/700"
              alt="UrbanCart featured products"
              className="w-full rounded-2xl object-cover shadow-lg"
            />
          </motion.div>
        </div>
      </section>

      <div className="container-page py-14">
        {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

        {!error && (
          <>
            {/* Featured categories */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Shop by Category</h2>
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-200" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {categories.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/products?category=${cat.slug}`}
                      className="group relative aspect-square overflow-hidden rounded-xl"
                    >
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3">
                        <span className="text-sm font-semibold text-white">{cat.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Trending products */}
            <section className="mb-16">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
                <Link to="/products?sort=popularity" className="text-sm font-medium text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
              {loading ? (
                <ProductGridSkeleton count={8} />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {trending.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}
            </section>

            {/* Promotional banner */}
            <section className="mb-16 overflow-hidden rounded-2xl bg-brand-700 px-6 py-10 text-center text-white sm:px-12">
              <h2 className="text-2xl font-bold sm:text-3xl">Season Sale — Up to 40% Off</h2>
              <p className="mt-2 text-brand-100">On selected electronics, fashion, and home essentials.</p>
              <Link to="/products?sort=price-low" className="btn-primary mt-6 inline-flex bg-white text-brand-700 hover:bg-gray-100">
                Shop the Sale
              </Link>
            </section>

            {/* Best sellers */}
            <section className="mb-16">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
                <Link to="/products?sort=rating" className="text-sm font-medium text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
              {loading ? (
                <ProductGridSkeleton count={4} />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {featured.slice(0, 4).map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}
            </section>

            {/* Why choose UrbanCart */}
            <section className="mb-16">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Why Choose UrbanCart</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {WHY_CHOOSE.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="card p-5">
                    <Icon className="mb-3 text-brand-600" size={26} />
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer reviews */}
            <section>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">What Our Customers Say</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="card p-5">
                    <div className="mb-2 flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">&ldquo;{t.text}&rdquo;</p>
                    <p className="mt-3 text-sm font-semibold text-gray-900">{t.name}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
