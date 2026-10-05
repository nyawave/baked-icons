'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PackageManager } from '@/lib/content';

type PmState = [PackageManager, (pm: PackageManager) => void];

const PmContext = createContext<PmState>(['pnpm', () => {}]);

export function PmProvider({ children }: { children: ReactNode }) {
  const state = useState<PackageManager>('pnpm');
  return <PmContext value={state}>{children}</PmContext>;
}

export function usePackageManager(): PmState {
  return useContext(PmContext);
}
