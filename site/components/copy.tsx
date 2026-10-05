'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AGENT_PROMPT, installCommand } from '@/lib/content';
import { usePackageManager } from './pm-context';

export function useCopy(): [copied: boolean, copy: (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return [copied, copy];
}

interface CopyPromptButtonProps {
  className: string;
  label: ReactNode;
  copiedLabel: ReactNode;
}

export function CopyPromptButton({ className, label, copiedLabel }: CopyPromptButtonProps) {
  const [copied, copy] = useCopy();
  return (
    <button type="button" className={className} onClick={() => copy(AGENT_PROMPT)} aria-live="polite">
      {copied ? copiedLabel : label}
    </button>
  );
}

export function CopyInstallPill() {
  const [pm] = usePackageManager();
  const [copied, copy] = useCopy();
  const cmd = installCommand(pm);
  return (
    <button type="button" className="hit cta-install" onClick={() => copy(cmd)}>
      <span className="code-font cta-install-cmd">{cmd}</span>
      <span className="cta-install-hint" aria-live="polite">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}
