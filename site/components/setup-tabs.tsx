'use client';

import { useId, useState, type ReactNode } from 'react';
import { installCommand, installDevCommand } from '@/lib/content';
import { usePackageManager } from './pm-context';

const TABS = [
  {
    id: 'next',
    label: 'Next.js',
    file: 'next.config.ts',
    code: (
      <>
        <span className="k">import</span> {'{ withBakedIcons } '}
        <span className="k">from</span> <span className="s">&apos;@nyawave/baked-icons/next&apos;</span>;{'\n'}
        <span className="k">import type</span> {'{ NextConfig } '}
        <span className="k">from</span> <span className="s">&apos;next&apos;</span>;{'\n\n'}
        <span className="k">const</span> {'nextConfig: NextConfig = {\n  reactStrictMode: true,\n};\n\n'}
        <span className="k">export default</span> withBakedIcons(nextConfig);
      </>
    ),
    note: 'Works with Turbopack (the Next.js 16 default) and next build --webpack. Use <Icon> inside Server Components as is.',
  },
  {
    id: 'vite',
    label: 'Vite',
    file: 'vite.config.ts',
    code: (
      <>
        <span className="k">import</span> react <span className="k">from</span>{' '}
        <span className="s">&apos;@vitejs/plugin-react&apos;</span>;{'\n'}
        <span className="k">import</span> bakedIcons <span className="k">from</span>{' '}
        <span className="s">&apos;@nyawave/baked-icons/vite&apos;</span>;{'\n'}
        <span className="k">import</span> {'{ defineConfig } '}
        <span className="k">from</span> <span className="s">&apos;vite&apos;</span>;{'\n\n'}
        <span className="k">export default</span> {'defineConfig({\n  plugins: [bakedIcons(), react()],\n});'}
      </>
    ),
    note: "The plugin runs with enforce: 'pre', so its position in the array does not matter.",
  },
  {
    id: 'webpack',
    label: 'webpack',
    file: 'webpack.config.js',
    code: (
      <>
        {'module.exports = {\n  module: {\n    rules: [{\n      test: '}
        <span className="s">{'/\\.[cm]?[jt]sx?$/'}</span>
        {',\n      exclude: '}
        <span className="s">/node_modules/</span>
        {',\n      use: [{ loader: '}
        <span className="s">&apos;@nyawave/baked-icons/loader&apos;</span>
        {' }],\n    }],\n  },\n};'}
      </>
    ),
    note: 'Run the loader before TypeScript, Babel or SWC (last in the use array) so it sees the original JSX.',
  },
  {
    id: 'other',
    label: 'Other',
    file: 'build.ts',
    code: (
      <>
        <span className="k">import</span> {'{\n  createTransformer,\n} '}
        <span className="k">from</span> <span className="s">&apos;@nyawave/baked-icons/transform&apos;</span>;{'\n\n'}
        <span className="k">const</span> {'t = createTransformer({ root: process.cwd() });\n\n'}
        <span className="c">{'// null when there is nothing to bake'}</span>
        {'\n'}
        <span className="k">const</span> {'out = t.transform(code, id);\n'}
        <span className="c">{'// otherwise { code, map, icons }'}</span>
      </>
    ),
    note: 'For any build tool that can rewrite source. One transformer shares its icon cache across the build.',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SetupTabs({ heading }: { heading: ReactNode }) {
  const id = useId();
  const [tab, setTab] = useState<TabId>('next');
  const [pm] = usePackageManager();
  const dev = installDevCommand(pm);

  return (
    <>
      <div className="setup-head">
        {heading}
        <div role="tablist" aria-label="Bundler" className="seg">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${id}-${t.id}-tab`}
              aria-controls={`${id}-${t.id}`}
              aria-selected={tab === t.id}
              className="hit seg-tab setup-tab"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="two">
        <div className="code-panel">
          <h3 className="code-label">1. Install</h3>
          <pre className="code">
            <span className="c"># the component and the transform</span>
            {`\n${installCommand(pm)}\n\n`}
            <span className="c"># the icon sets you use</span>
            {`\n${dev} @iconify-json/mdi @iconify-json/lucide\n\n`}
            <span className="c"># or every set at once</span>
            {`\n${dev} @iconify/json`}
          </pre>
        </div>
        <div className="code-panel setup-config">
          {TABS.map((t) => (
            <div key={t.id} role="tabpanel" id={`${id}-${t.id}`} aria-labelledby={`${id}-${t.id}-tab`} hidden={tab !== t.id}>
              <h3 className="code-label">2. {t.file}</h3>
              <pre className="code">{t.code}</pre>
              <p className="code-note">{t.note}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
