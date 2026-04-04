import { useState, useRef, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';
import BrandLogo from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ChevronDown, UserCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-[Lato,sans-serif]">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between">
        <BrandLogo />

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
              {user?.profile_image ? (
                <img src={`${API_BASE}${user.profile_image}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-orange-500">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 hidden sm:block">{user?.name}</p>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden z-50">
              <button
                onClick={() => { navigate('/profile'); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <UserCircle size={15} />
                My Profile
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto px-10 py-8 min-h-[calc(100vh-57px)]">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
