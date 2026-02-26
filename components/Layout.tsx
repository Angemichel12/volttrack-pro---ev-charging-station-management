import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Stations',  path: '/admin/stations',  icon: '⛽' },
    { label: 'Employees', path: '/admin/employees', icon: '👥' },
    { label: 'Reports',   path: '/admin/reports',   icon: '📈' },
  ],
  staff: [
    { label: 'Dashboard', path: '/staff/dashboard', icon: '🔌' },
    { label: 'History',   path: '/staff/history',   icon: '📜' },
    { label: 'Reports',   path: '/staff/reports',   icon: '📉' },
  ],
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] ?? [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">

      {/* ── Sidebar - Desktop ───────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">
            VoltTrack<span className="text-gray-900">Pro</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
            {user.role}
          </p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="mr-3">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Top Bar - Mobile ────────────────────────────────────── */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">VoltTrack</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Mobile Menu Overlay ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">VoltTrack Pro</h1>
            <button onClick={() => setMobileMenuOpen(false)} className="text-2xl">&times;</button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-4 py-4 text-lg font-medium rounded-xl ${
                  pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                }`}
              >
                <span className="mr-4 text-2xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">{user.name}</p>
            <p className="text-xs text-gray-400 mb-4">{user.email}</p>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-4 text-lg font-bold text-red-600 bg-red-50 rounded-xl"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Bottom Nav - Mobile ─────────────────────────────────── */}
      <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around items-center py-2 fixed bottom-0 w-full z-10 shadow-lg">
        {navItems.slice(0, 4).map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center px-2 ${
              pathname === item.path ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

    </div>
  );
};