import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal, PasswordInput, Button } from './Shared';
import { useChangePassword } from '../hooks/useLogin';
import {
  IconDashboard, IconStation, IconUsers, IconCar, IconCharger, IconChart,
  IconWallet, IconHistory, IconLogout, IconMenu, IconClose, IconMore,
  IconShift, IconBolt, IconKey, IconCheck,
} from './Icons';

// ── Change-password modal for the logged-in user (any role) ──────────────────
const ChangePasswordModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { changePassword, loading } = useChangePassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const valid = newPassword.length >= 8 && confirm === newPassword;

  const reset = () => { setNewPassword(''); setConfirm(''); };
  const close = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!valid) return;
    const ok = await changePassword(newPassword, confirm);
    if (ok) close();
  };

  return (
    <Modal open={open} onClose={close} title="Change password / Hindura ijambobanga">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Set a new password for your account (min 8 characters). /
          Shyiraho ijambobanga rishya (nibura inyuguti 8).
        </p>
        <PasswordInput
          label="New password / Ijambobanga rishya"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          hint={tooShort ? 'Too short / Rigufi cyane (8+)' : undefined}
        />
        <PasswordInput
          label="Confirm password / Emeza ijambobanga"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          hint={mismatch ? "Passwords don't match / Ntabwo bihura" : undefined}
        />
        <Button className="w-full py-3" onClick={handleSave} disabled={loading || !valid}>
          <IconCheck className="w-4 h-4" />
          {loading ? 'Tegereza...' : 'Change / Hindura'}
        </Button>
      </div>
    </Modal>
  );
};

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard / Ahabanza', path: '/admin/dashboard', icon: IconDashboard },
    { label: 'Stations / Sitasiyo',  path: '/admin/stations',  icon: IconStation },
    { label: 'Chargers',             path: '/admin/chargers',  icon: IconCharger },
    { label: 'Employees / Abakozi',  path: '/admin/employees', icon: IconUsers },
    { label: 'Cars / Imodoka',       path: '/admin/cars',      icon: IconCar },
    { label: 'Expenses / Ibyasohotse', path: '/admin/expenses', icon: IconWallet },
    { label: 'Reports / Raporo',     path: '/admin/reports',   icon: IconChart },
  ],
  staff: [
    { label: 'Shift / shifuti',         path: '/staff/shift',     icon: IconShift },
    { label: 'Sessions / Gusharija', path: '/staff/sessions',  icon: IconBolt },
    { label: 'Cars / Imodoka',       path: '/staff/cars',      icon: IconCar },
    { label: 'History / Amateka',    path: '/staff/history',   icon: IconHistory },
    { label: 'Reports / Raporo',     path: '/staff/reports',   icon: IconChart },
  ],
};

const Logo: React.FC<{ className?: string }> = ({ className = 'h-10' }) => (
  <img src="/logo.png" alt="GreenSpark Charging Rwanda" className={`${className} w-auto object-contain`} />
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);

  if (!user) return null;

  const openChangePw = () => { setChangePwOpen(true); setMobileMenuOpen(false); };

  const navItems = NAV_ITEMS[user.role] ?? [];
  const bottomNavItems = navItems.slice(0, 4);
  const go = (path: string) => { navigate(path); setMobileMenuOpen(false); };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">

      {/* ── Sidebar - Desktop ───────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          <Logo className="h-12" />
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-semibold">
            {user.role} portal
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  active
                    ? 'bg-green-50 text-green-800'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-green-700' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3.5 py-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.phone_number}</p>
          </div>
          <button
            onClick={openChangePw}
            className="mt-1 w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl transition-colors"
          >
            <IconKey className="w-5 h-5" /> Change password / Hindura
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <IconLogout className="w-5 h-5" /> Logout / Sohoka
          </button>
        </div>
      </aside>

      {/* ── Top Bar - Mobile ────────────────────────────────────── */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <Logo className="h-9" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
        >
          {mobileMenuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </header>

      {/* ── Mobile Menu Overlay ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
            <Logo className="h-9" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              <IconClose />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-base font-medium rounded-2xl transition-colors ${
                    active ? 'bg-green-50 text-green-800' : 'text-gray-600 active:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${active ? 'text-green-700' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-5 border-t border-gray-100 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400 mb-4">{user.phone_number}</p>
            <button
              onClick={openChangePw}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-bold text-gray-700 bg-gray-100 rounded-2xl mb-3"
            >
              <IconKey className="w-5 h-5" /> Change password / Hindura
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-bold text-red-600 bg-red-50 rounded-2xl"
            >
              <IconLogout className="w-5 h-5" /> Logout / Sohoka
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Bottom Nav - Mobile ─────────────────────────────────── */}
      <nav className="md:hidden bg-white/95 backdrop-blur border-t border-gray-200 grid grid-cols-5 items-stretch fixed bottom-0 w-full z-30 pb-[env(safe-area-inset-bottom)]">
        {bottomNavItems.map(item => {
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 ${
                active ? 'text-green-700' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[9px] font-semibold leading-tight text-center px-0.5">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 ${mobileMenuOpen ? 'text-green-700' : 'text-gray-400'}`}
        >
          <IconMore className="w-6 h-6" />
          <span className="text-[9px] font-semibold leading-tight text-center px-0.5">More / Ibindi</span>
        </button>
      </nav>

      {/* ── Change password modal ───────────────────────────────── */}
      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />

    </div>
  );
};
