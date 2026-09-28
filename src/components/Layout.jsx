import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navStructure = [
  {
    label: 'Browse',
    icon: '🔍',
    to: '/',
    end: true,
    roles: ['student', 'instructor', 'admin'],
  },
  {
    label: 'My Learning',
    icon: '📚',
    to: '/my-learning',
    roles: ['student', 'instructor', 'admin'],
  },
  {
    label: 'Instructor',
    icon: '🎓',
    roles: ['instructor', 'admin'],
    children: [
      { label: 'Dashboard', to: '/instructor' },
      { label: 'New Course', to: '/instructor/courses/new' },
    ],
  },
  {
    label: 'Admin',
    icon: '⚙️',
    roles: ['admin'],
    children: [
      { label: 'Users', to: '/admin' },
      { label: 'Categories', to: '/admin/categories' },
      { label: 'Moderation', to: '/admin/moderation' },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({ Instructor: false, Admin: false });

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  const toggle = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const visible = navStructure.filter((l) => !l.roles || l.roles.includes(user?.role));

  const Sidebar = (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-full">
      <div className="p-5 text-xl font-bold text-white border-b border-slate-800 flex items-center gap-2">
        <span>🎓</span> <span>LearnHub</span>
      </div>

      <nav className="flex-1 p-3 space-y-1 text-sm overflow-y-auto">
        {visible.map((item) =>
          item.children ? (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span className="text-xs">{expanded[item.label] ? '▾' : '▸'}</span>
              </button>

              {expanded[item.label] && (
                <div className="mt-1 ml-6 space-y-1">
                  {item.children.map((c) => (
                    <NavLink
                      key={c.to}
                      to={c.to}
                      end={c.to === '/instructor' || c.to === '/admin'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `block px-3 py-1.5 rounded-md text-xs ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`
                      }
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 text-sm">
        <div className="text-white font-medium truncate">{user?.name}</div>
        <div className="text-slate-400 text-xs truncate">{user?.email}</div>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden md:flex md:flex-shrink-0">{Sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-700 text-2xl leading-none"
          >
            ☰
          </button>
          <span className="font-semibold">🎓 LearnHub</span>
          <span className="w-6" />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}