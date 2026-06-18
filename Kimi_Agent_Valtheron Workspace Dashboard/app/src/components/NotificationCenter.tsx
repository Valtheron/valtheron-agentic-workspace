import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, Info, X, CheckCheck } from 'lucide-react';
import type { Notification, ActivityType } from '@/lib/mockData';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

const typeConfig: Record<ActivityType, { icon: typeof AlertCircle; color: string; bg: string }> = {
  security: { icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  workflow: { icon: Info, color: '#5B8DEF', bg: 'rgba(91,141,239,0.12)' },
  agent: { icon: CheckCircle, color: '#3DDC97', bg: 'rgba(61,220,151,0.12)' },
  system: { icon: AlertTriangle, color: '#F5A623', bg: 'rgba(245,166,35,0.12)' },
  comment: { icon: Info, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
};

export default function NotificationCenter({ isOpen, onClose, notifications, onMarkAllRead, onDismiss }: NotificationCenterProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={onClose} />
          <motion.div
            className="absolute right-4 top-[60px] z-[100] w-[380px] max-h-[480px] rounded-xl border overflow-hidden flex flex-col"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                  style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => {
                  const config = typeConfig[notification.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className="relative flex items-start gap-3 px-4 py-3 border-b transition-colors"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        backgroundColor: notification.read ? 'transparent' : 'rgba(61,220,151,0.03)',
                      }}
                    >
                      {!notification.read && (
                        <div
                          className="absolute left-0 top-3 bottom-3 rounded-r"
                          style={{ width: '3px', backgroundColor: config.color }}
                        />
                      )}
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: config.bg,
                        }}
                      >
                        <Icon size={16} style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm leading-tight"
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: notification.read ? 400 : 500,
                          }}
                        >
                          {notification.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {notification.message}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {notification.timestamp}
                        </div>
                      </div>
                      <button
                        onClick={() => onDismiss(notification.id)}
                        className="flex-shrink-0 mt-0.5 transition-opacity hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
