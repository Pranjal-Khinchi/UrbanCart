import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : '/products');
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      {/* Announcement bar */}
      <div className="bg-brand-700 px-4 py-1.5 text-center text-xs font-medium text-white">
        Free shipping on orders above ₹999 · Easy returns within 7 days
      </div>

      <div className="container-page flex h-16 items-center gap-4">
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">U</span>
          UrbanCart
        </Link>

        <form onSubmit={handleSearch} className="relative hidden flex-1 max-w-xl lg:block">
          <label htmlFor="nav-search" className="sr-only">
            Search products
          </label>
          <input
            id="nav-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="input-field pr-10"
          />
          <button type="submit" aria-label="Search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </button>
        </form>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          <Link to="/products" className="text-sm font-medium text-gray-700 hover:text-brand-600">
            All Products
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-4">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <Heart size={20} />
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart, ${itemCount} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={accountOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              aria-label="Account menu"
            >
              <User size={20} />
            </button>
            {accountOpen && (
              <div
                className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white py-2 shadow-lg"
                onMouseLeave={() => setAccountOpen(false)}
              >
                {user ? (
                  <>
                    <div className="border-b border-gray-100 px-4 py-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={15} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Package size={15} /> My Orders
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard size={15} /> Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={15} /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-4 py-2">
                    <Link to="/login" onClick={() => setAccountOpen(false)} className="btn-primary w-full">
                      Log in
                    </Link>
                    <Link to="/register" onClick={() => setAccountOpen(false)} className="btn-secondary w-full">
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 px-4 py-4 lg:hidden">
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-field pr-10"
            />
            <button type="submit" aria-label="Search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </button>
          </form>
          <Link to="/products" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-gray-700">
            All Products
          </Link>
          {!user && (
            <div className="mt-3 flex gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary flex-1">
                Log in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
