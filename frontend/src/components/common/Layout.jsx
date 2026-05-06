import { useState, useRef, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notificationsApi';
import { timeAgo } from '../../utils/formatDate';
import { LogOut, ChevronDown, UserCircle, Menu, Bell, CheckCheck, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen]   = useState(false);
  const [bellOpen, setBellOpen]         = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [scrolled, setScrolled]         = useState(false);
  const dropdownRef = useRef(null);
  const bellRef     = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then(r => r.data.data.notifications),
    enabled: !!user,
  });
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const previewList = notifications.slice(0, 5);

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markOneMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close both dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
      if (bellRef.current     && !bellRef.current.contains(e.target))     setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-[Lato,sans-serif]">

      {/* ── Header ── */}
      <header className={`sticky top-0 z-50 bg-white h-16 px-6 flex items-center gap-4 transition-shadow duration-200 ${scrolled ? 'shadow-md' : ''}`}>

        {/* Left: burger + logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="text-gray-500" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">I</span>
            </div>
            <span className="text-[15px] font-semibold text-gray-800 tracking-tight">
              Ishyaculturetroup
            </span>
          </div>
        </div>

        {/* Center: global search */}
        <GlobalSearch user={user} />

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Notification bell + dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setBellOpen(v => !v); setProfileOpen(false); }}
              className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-[360px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.13)' }}>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <span className="text-[16px] font-black text-slate-800">Notifications</span>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllMutation.mutate()}
                        title="Mark all as read"
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-slate-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <CheckCheck size={13} /> Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                      title="See all notifications"
                      className="p-1.5 text-gray-400 hover:text-slate-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-gray-100 px-5">
                  {['All', 'Unread'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => {}}
                      className={`text-[13px] font-semibold pb-2.5 mr-5 border-b-2 transition-colors ${
                        tab === 'All'
                          ? 'border-orange-500 text-orange-500'
                          : 'border-transparent text-gray-400 hover:text-slate-600'
                      }`}
                    >
                      {tab}
                      {tab === 'Unread' && unreadCount > 0 && (
                        <span className="ml-1.5 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── List ── */}
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      {/* Flag illustration */}
                      <svg width="90" height="100" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                        <rect x="30" y="18" width="7" height="72" rx="3.5" fill="#f97316"/>
                        <rect x="36" y="12" width="5" height="8" rx="2.5" fill="#ea580c"/>
                        <circle cx="36" cy="11" r="5" fill="#f97316"/>
                        <rect x="37" y="22" width="38" height="32" rx="5" fill="#f97316" transform="rotate(-4 37 22)"/>
                        <rect x="40" y="44" width="38" height="24" rx="5" fill="#ea580c" transform="rotate(3 40 44)"/>
                        <path d="M42 28 L52 36 L42 44" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                        <ellipse cx="44" cy="94" rx="20" ry="5" fill="#1e293b" opacity="0.07"/>
                      </svg>
                      <p className="text-sm font-semibold text-slate-500">You're all caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">No notifications from the last 30 days.</p>
                    </div>
                  ) : (
                    previewList.map(n => (
                      <button
                        key={n.id}
                        onClick={() => { if (!n.is_read) markOneMutation.mutate(n.id); }}
                        className={`w-full text-left flex gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0 ${!n.is_read ? 'bg-orange-50/60' : ''}`}
                      >
                        {/* Icon circle */}
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5 ${!n.is_read ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <Bell size={13} className={!n.is_read ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[12.5px] font-semibold leading-snug ${!n.is_read ? 'text-slate-800' : 'text-gray-600'}`}>{n.title}</p>
                            {!n.is_read && <span className="shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1.5"/>}
                          </div>
                          <p className="text-[11.5px] text-gray-400 mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                          <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    {unreadCount > 0 ? <><span className="font-semibold text-orange-500">{unreadCount}</span> unread</> : 'All caught up'}
                  </p>
                  <button
                    onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                    className="text-[12px] font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    See all →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setProfileOpen(v => !v); setBellOpen(false); }}
              className="flex items-center hover:opacity-80 transition-opacity p-1"
              title={user?.name}
            >
              <div className="w-9 h-9 rounded-full bg-orange-500 overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-orange-300 transition-all shrink-0">
                {user?.profile_image ? (
                  <img src={`${API_BASE}${user.profile_image}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <UserCircle size={15} /> My Profile
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex">
        <Sidebar open={sidebarOpen} />
        <main className="flex-1 overflow-auto px-10 py-8 min-h-[calc(100vh-56px)]">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
