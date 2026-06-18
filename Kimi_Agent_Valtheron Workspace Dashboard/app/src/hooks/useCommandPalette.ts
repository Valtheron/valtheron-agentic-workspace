import { useState, useEffect, useCallback } from 'react';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') {
        close();
      }
    };

    const handleCustomToggle = () => {
      toggle();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('toggle-command-palette', handleCustomToggle);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('toggle-command-palette', handleCustomToggle);
    };
  }, [toggle, close]);

  return { isOpen, open, close, toggle };
}
