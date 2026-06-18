import { useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import KillSwitchFAB from './KillSwitchFAB';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { notificationsData, commandPaletteItems } from '@/lib/mockData';
import type { Notification } from '@/lib/mockData';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen: paletteOpen, close: closePalette } = useCommandPalette();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(notificationsData);

  const breadcrumb = location.pathname === '/' ? 'Dashboard' :
    location.pathname === '/monitoring' ? 'Monitoring' :
    location.pathname === '/templates' ? 'Templates' :
    location.pathname === '/collaboration' ? 'Collaboration' :
    location.pathname === '/customization' ? 'Customization' : 'Dashboard';

  const handleNavigate = useCallback((href: string) => {
    navigate(href);
  }, [navigate]);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleDismissNotif = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleSearchClick = useCallback(() => {
    // Dispatch custom event to toggle command palette
    document.dispatchEvent(new CustomEvent('toggle-command-palette'));
  }, []);

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <Navbar
        onSearchClick={handleSearchClick}
        onBellClick={() => setNotifOpen((prev) => !prev)}
        notifications={notifications}
        breadcrumb={breadcrumb}
      />
      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onDismiss={handleDismissNotif}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: '240px',
          minHeight: 'calc(100dvh - 56px)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <main className="px-8 py-6" style={{ maxWidth: '1440px' }}>
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Global Components */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={closePalette}
        items={commandPaletteItems}
        onNavigate={handleNavigate}
      />
      <KillSwitchFAB />
    </div>
  );
}
