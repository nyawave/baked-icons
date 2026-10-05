'use client';

import { Icon } from '@nyawave/baked-icons';
import { useId, useState, type ReactNode } from 'react';
import { AGENT_PROMPT, PACKAGE_MANAGERS, installCommand } from '@/lib/content';
import { useCopy } from './copy';
import { usePackageManager } from './pm-context';

type Mode = 'term' | 'agent';

export function GetStarted() {
  const id = useId();
  const [mode, setMode] = useState<Mode>('term');
  const [showPrompt, setShowPrompt] = useState(false);
  const [pm, setPm] = usePackageManager();
  const [installCopied, copyInstall] = useCopy();
  const [promptCopied, copyPrompt] = useCopy();
  const cmd = installCommand(pm);

  const tab = (value: Mode, label: string, icon: ReactNode) => (
    <button
      type="button"
      role="tab"
      id={`${id}-${value}-tab`}
      aria-controls={`${id}-${value}`}
      aria-selected={mode === value}
      className="hit seg-tab start-tab"
      onClick={() => setMode(value)}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="card start">
      <div role="tablist" aria-label="Get started" className="seg">
        {tab('term', 'Install', <Icon icon="lucide:terminal" width={16} />)}
        {tab('agent', 'With an AI agent', <Icon icon="lucide:sparkle" width={16} />)}
      </div>

      <div role="tabpanel" id={`${id}-term`} aria-labelledby={`${id}-term-tab`} hidden={mode !== 'term'} className="start-panel">
        <div role="group" aria-label="Package manager" className="pm-row">
          {PACKAGE_MANAGERS.map((p) => (
            <button key={p} type="button" className="hit pill" aria-pressed={pm === p} onClick={() => setPm(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="cmd">
          <span className="code-font cmd-text">
            <span className="muted">$ </span>
            {cmd}
          </span>
          <button type="button" className="hit btn btn-acc cmd-copy" onClick={() => copyInstall(cmd)} aria-live="polite">
            {installCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="start-note">
          Then add one plugin for your bundler. <a href="#setup">Setup guide</a>
        </p>
      </div>

      <div role="tabpanel" id={`${id}-agent`} aria-labelledby={`${id}-agent-tab`} hidden={mode !== 'agent'} className="start-panel">
        <p className="agent-text">
          Paste it into Cursor, Claude Code or Codex. The agent installs the package and your icon sets, configures the
          bundler and swaps the imports.
        </p>
        <div className="agent-actions">
          <button type="button" className="hit btn btn-acc" onClick={() => copyPrompt(AGENT_PROMPT)} aria-live="polite">
            {promptCopied ? 'Copied, paste it into your agent' : 'Copy prompt'}
          </button>
          <button
            type="button"
            className="hit btn btn-soft"
            aria-expanded={showPrompt}
            aria-controls={`${id}-prompt`}
            onClick={() => setShowPrompt((v) => !v)}
          >
            {showPrompt ? 'Hide prompt' : 'Show prompt'}
          </button>
        </div>
        <pre id={`${id}-prompt`} className="code wrapit prompt-pre" hidden={!showPrompt}>
          {AGENT_PROMPT}
        </pre>
      </div>
    </div>
  );
}
