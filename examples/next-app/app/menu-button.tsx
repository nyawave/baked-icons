'use client';
import { Icon } from '@nyawave/baked-icons';
import { useState } from 'react';

export function MenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen((v) => !v)} style={{ width: 'fit-content' }}>
      <Icon icon={open ? 'mdi:menu-open' : 'mdi:menu'} width={20} inline /> {open ? 'close' : 'open'} menu
    </button>
  );
}
