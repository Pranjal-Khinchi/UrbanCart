import { Link } from 'react-router-dom';
import { Mail, Facebook, Instagram, Twitter } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    showToast('Thanks for subscribing to UrbanCart updates!', 'success');
    setEmail('');
  };

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">U</span>
            UrbanCart
          </div>
          <p className="text-sm text-gray-400">Everything you need. One better place.</p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white"><Facebook size={18} /></a>
            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white"><Instagram size={18} /></a>
            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white"><Twitter size={18} /></a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-white">All Products</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-white">New Arrivals</Link></li>
            <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/profile" className="hover:text-white">My Profile</Link></li>
            <li><Link to="/orders" className="hover:text-white">Order History</Link></li>
            <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Stay updated</h4>
          <p className="mb-3 text-sm text-gray-400">Get news on new arrivals and offers.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
            />
            <button type="submit" aria-label="Subscribe" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700">
              <Mail size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} UrbanCart. All rights reserved. Built as a demo full-stack project.
      </div>
    </footer>
  );
}
