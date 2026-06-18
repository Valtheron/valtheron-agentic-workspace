import { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import type { Notification } from '@/lib/mockData';

interface NavbarProps {
  onSearchClick: () => void;
  onBellClick: () => void;
  notifications: Notification[];
  breadcrumb: string;
}

export default function Navbar({ onSearchClick, onBellClick, notifications, breadcrumb }: NavbarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [avatarError, setAvatarError] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 border-b"
      style={{
        height: '56px',
        backgroundColor: 'rgba(12, 17, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2L4 12V28L20 38L36 28V12L20 2Z" stroke="#3DDC97" strokeWidth="2.5" fill="none" />
          <path d="M20 10L12 15V25L20 30L28 25V15L20 10Z" stroke="#3DDC97" strokeWidth="1.5" fill="rgba(61,220,151,0.15)" />
          <circle cx="20" cy="20" r="3" fill="#3DDC97" />
        </svg>
        <span
          className="font-semibold tracking-[0.15em]"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
          }}
        >
          VALTHERON
        </span>
      </div>

      {/* Center: Breadcrumb */}
      <div className="hidden md:flex items-center">
        <span
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          Dashboard
          {breadcrumb && breadcrumb !== 'Dashboard' && (
            <>
              <ChevronDown className="inline mx-1" size={12} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)' }} />
              <span style={{ color: 'var(--text-primary)' }}>{breadcrumb}</span>
            </>
          )}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSearchClick}
          className="flex items-center justify-center rounded-lg transition-all"
          style={{
            width: '36px',
            height: '36px',
            color: 'var(--text-secondary)',
          }}
          title="Search (Ctrl+K)"
        >
          <Search size={18} />
        </button>
        <button
          onClick={onBellClick}
          className="relative flex items-center justify-center rounded-lg transition-all"
          style={{
            width: '36px',
            height: '36px',
            color: 'var(--text-secondary)',
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className="absolute rounded-full"
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--accent-danger)',
                top: '6px',
                right: '6px',
              }}
            />
          )}
        </button>
        <div
          className="ml-2 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--bg-surface-hover)',
            border: '1px solid var(--bg-surface-border)',
          }}
        >
          {avatarError ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>A</span>
          ) : (
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
              alt="User"
              className="w-full h-full"
              onError={() => setAvatarError(true)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
