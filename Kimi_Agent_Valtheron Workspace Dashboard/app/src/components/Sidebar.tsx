import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { LayoutDashboard, Activity, Library, Users, Sliders, Bot, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Monitoring', path: '/monitoring', icon: Activity },
  { label: 'Templates', path: '/templates', icon: Library },
  { label: 'Collaboration', path: '/collaboration', icon: Users },
  { label: 'Customization', path: '/customization', icon: Sliders },
  { label: 'Agents', path: '#', icon: Bot, external: true },
  { label: 'Tasks', path: '#', icon: CheckSquare, external: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className="fixed left-0 top-[56px] h-[calc(100vh-56px)] flex flex-col transition-all duration-300 z-40 border-r"
      style={{
        width: collapsed ? '64px' : '240px',
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'rgba(255,255,255,0.06)',
        background: 'linear-gradient(90deg, rgba(61,220,151,0.08) 0%, transparent 50%), var(--bg-surface)',
      }}
    >
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.external ? false : location.pathname === item.path;

            if (item.external) {
              return (
                <li key={item.label}>
                  <div
                    className="flex items-center gap-3 px-3 rounded-lg transition-all cursor-not-allowed opacity-50"
                    style={{
                      height: '44px',
                      color: 'var(--text-muted)',
                    }}
                    title={item.label}
                  >
                    <Icon size={18} />
                    {!collapsed && (
                      <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>{item.label}</span>
                    )}
                  </div>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className="flex items-center gap-3 px-3 rounded-lg transition-all relative"
                  style={{
                    height: '44px',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'rgba(61,220,151,0.15)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 rounded-r"
                      style={{
                        width: '3px',
                        height: '60%',
                        backgroundColor: 'var(--accent-primary)',
                      }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    />
                  )}
                  <Icon size={18} />
                  {!collapsed && (
                    <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2 w-full rounded-lg transition-all hover:opacity-80"
          style={{
            height: '36px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span style={{ fontSize: '0.75rem' }}>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
