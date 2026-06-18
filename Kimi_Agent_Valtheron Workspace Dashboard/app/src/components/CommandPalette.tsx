import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Activity, Library, Users, Sliders, Plus, Bot, Download, Clock, ArrowRight } from 'lucide-react';
import type { CommandItem } from '@/lib/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
  onNavigate: (href: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Activity,
  Library,
  Users,
  Sliders,
  Plus,
  Bot,
  Download,
  Clock,
};

export default function CommandPalette({ isOpen, onClose, items, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const grouped = {
    recent: filtered.filter((i) => i.category === 'recent'),
    navigation: filtered.filter((i) => i.category === 'navigation'),
    action: filtered.filter((i) => i.category === 'action'),
  };

  const flatItems = [...grouped.navigation, ...grouped.action, ...grouped.recent];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      const item = flatItems[selectedIndex];
      if (item?.href) {
        onNavigate(item.href);
        onClose();
        setQuery('');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[560px] rounded-xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, navigate pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none py-4"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '0.9375rem',
                }}
              />
              <kbd
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto py-2">
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No results found
                </div>
              ) : (
                flatItems.map((item, index) => {
                  const Icon = iconMap[item.icon || ''] || ArrowRight;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors"
                      style={{
                        backgroundColor: isSelected ? 'rgba(61,220,151,0.15)' : 'transparent',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => {
                        if (item.href) {
                          onNavigate(item.href);
                          onClose();
                          setQuery('');
                        }
                      }}
                    >
                      <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0, lineHeight: 0 }}><Icon size={16} /></span>
                      <span style={{ fontSize: '0.875rem', flex: 1 }}>{item.label}</span>
                      {item.shortcut && (
                        <kbd
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--bg-surface-hover)',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2 border-t"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
                fontSize: '0.6875rem',
              }}
            >
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <span>{filtered.length} commands</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
