'use client';

import { Icon } from '@nyawave/baked-icons';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    setTheme(next);
  };

  const label = theme ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Toggle theme';
  return (
    <button type="button" className="hit theme-btn" onClick={toggle} aria-label={label} title={label}>
      <Icon icon="lucide:sun" width={18} className="theme-icon theme-icon--light" />
      <Icon icon="lucide:moon" width={18} className="theme-icon theme-icon--dark" />
    </button>
  );
}
