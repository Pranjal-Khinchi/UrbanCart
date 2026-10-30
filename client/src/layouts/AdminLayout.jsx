import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  Users,
  Star,
  ArrowLeft,
} from 'lucide-react';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 text-lg font-bold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">U</span>
          Admin
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600">
            <ArrowLeft size={16} /> Back to store
          </Link>
        </div>
      </aside>

      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <span className="text-base font-bold text-brand-700">UrbanCart Admin</span>
          <Link to="/" className="text-sm font-medium text-brand-600">
            Back to store
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
