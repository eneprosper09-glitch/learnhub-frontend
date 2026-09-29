import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ variant = 'app' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const isMarketing = variant === 'marketing';

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
    enabled: !!user || isMarketing,
  });

  const { data: notificationsRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    enabled: !!user,
    refetchInterval: 60000,
  });

  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];
  const notifications = Array.isArray(notificationsRes?.data)
    ? notificationsRes.data
    : [];
  const unread = notificationsRes?.unread || 0;

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      nav('/courses');
      return;
    }
    nav(`/courses?search=${encodeURIComponent(q)}`);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    nav('/');
  };

  const openNotification = async (n) => {
    try {
      if (!n.isRead) {
        await api.put(`/notifications/${n._id}/read`);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch {
      // ignore
    }
    setNotifOpen(false);
    if (n.link) nav(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('All marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-black-800 border-b border-black-100 dark:border-black-700">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🎓</span>
            <span className="font-display font-extrabold text-lg text-black-900 dark:text-white hidden sm:inline">
              LearnHub
            </span>
          </Link>

          <form onSubmit={onSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black-400 text-sm">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for courses..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-black-50 dark:bg-black-700 border border-black-200 dark:border-black-600 text-black-900 dark:text-white rounded-full focus:outline-none focus:border-black-400 focus:bg-white dark:focus:bg-black-800 transition"
              />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            <div className="relative group">
              <button className="px-3 py-2 text-sm font-medium text-black-700 dark:text-black-200 hover:text-black-900 dark:hover:text-white rounded-lg hover:bg-black-50 dark:hover:bg-black-700 transition">
                Categories
              </button>
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-xl shadow-soft py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                {categories.length === 0 && (
                  <div className="px-4 py-2 text-sm text-black-400">
                    No categories yet
                  </div>
                )}
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    to={`/courses?category=${c._id}`}
                    className="block px-4 py-2 text-sm text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700 hover:text-black-900 dark:hover:text-white"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-lg transition ${
                  isActive
                    ? 'text-black-900 dark:text-white bg-black-50 dark:bg-black-700'
                    : 'text-black-700 dark:text-black-200 hover:text-black-900 dark:hover:text-white hover:bg-black-50 dark:hover:bg-black-700'
                }`
              }
            >
              Browse
            </NavLink>

            {user && (
              <NavLink
                to="/my-learning"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? 'text-black-900 dark:text-white bg-black-50 dark:bg-black-700'
                      : 'text-black-700 dark:text-black-200 hover:text-black-900 dark:hover:text-white hover:bg-black-50 dark:hover:bg-black-700'
                  }`
                }
              >
                My Learning
              </NavLink>
            )}

            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <NavLink
                to="/instructor"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? 'text-black-900 dark:text-white bg-black-50 dark:bg-black-700'
                      : 'text-black-700 dark:text-black-200 hover:text-black-900 dark:hover:text-white hover:bg-black-50 dark:hover:bg-black-700'
                  }`
                }
              >
                Teach
              </NavLink>
            )}

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? 'text-black-900 dark:text-white bg-black-50 dark:bg-black-700'
                      : 'text-black-700 dark:text-black-200 hover:text-black-900 dark:hover:text-white hover:bg-black-50 dark:hover:bg-black-700'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2 ml-auto lg:ml-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black-50 dark:hover:bg-black-700 transition"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>

            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black-50 dark:hover:bg-black-700 transition"
                  aria-label="Notifications"
                >
                  <span className="text-lg">🔔</span>
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-2xl shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black-100 dark:border-black-700">
                      <div className="font-semibold text-black-900 dark:text-white text-sm">
                        Notifications
                      </div>
                      {unread > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-black-500 hover:text-black-900 dark:text-black-300 dark:hover:text-white font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-black-500">
                          You are all caught up.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n._id}
                            onClick={() => openNotification(n)}
                            className={`w-full text-left px-4 py-3 border-b border-black-50 dark:border-black-700 hover:bg-black-50 dark:hover:bg-black-700 transition ${
                              !n.isRead ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-lg flex-shrink-0">
                                {n.type === 'review'
                                  ? '⭐'
                                  : n.type === 'answer'
                                  ? '💬'
                                  : n.type === 'announcement'
                                  ? '📣'
                                  : n.type === 'enrollment'
                                  ? '👥'
                                  : n.type === 'certificate'
                                  ? '🏆'
                                  : '🔔'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-black-900 dark:text-white truncate">
                                  {n.title}
                                </div>
                                {n.body && (
                                  <div className="text-xs text-black-600 dark:text-black-300 mt-0.5 line-clamp-2">
                                    {n.body}
                                  </div>
                                )}
                                <div className="text-[10px] text-black-400 mt-1">
                                  {new Date(n.createdAt).toLocaleString()}
                                </div>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-black-700 dark:text-black-200 hover:text-black-900 dark:hover:text-white transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-black-900 dark:bg-white text-white dark:text-black-900 rounded-xl hover:bg-black-800 dark:hover:bg-black-100 transition"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="w-9 h-9 rounded-full bg-black-900 dark:bg-white text-white dark:text-black-900 flex items-center justify-center text-sm font-semibold hover:bg-black-800 dark:hover:bg-black-100 transition overflow-hidden"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name?.[0]?.toUpperCase()
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-black-800 border border-black-200 dark:border-black-700 rounded-xl shadow-soft py-2">
                    <div className="px-4 py-2 border-b border-black-100 dark:border-black-700">
                      <div className="text-sm font-semibold text-black-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-black-500 truncate">
                        {user.email}
                      </div>
                    </div>
                    <Link
                      to="/my-learning"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
                    >
                      My Learning
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
                    >
                      Profile
                    </Link>
                    {(user.role === 'instructor' || user.role === 'admin') && (
                      <Link
                        to="/instructor"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
                      >
                        Instructor Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-black-100 dark:border-black-700 mt-1"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black-50 dark:hover:bg-black-700 transition"
              aria-label="Menu"
            >
              <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-black-100 dark:border-black-700 bg-white dark:bg-black-800">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            <form onSubmit={onSearch} className="mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for courses..."
                className="w-full px-4 py-2 text-sm bg-black-50 dark:bg-black-700 border border-black-200 dark:border-black-600 rounded-full focus:outline-none focus:border-black-400 text-black-900 dark:text-white"
              />
            </form>
            <NavLink
              to="/courses"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
            >
              Browse courses
            </NavLink>
            {user && (
              <NavLink
                to="/my-learning"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
              >
                My Learning
              </NavLink>
            )}
            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <NavLink
                to="/instructor"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
              >
                Instructor
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-black-700 dark:text-black-200 hover:bg-black-50 dark:hover:bg-black-700"
              >
                Admin
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}