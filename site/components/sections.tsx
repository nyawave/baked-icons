import { Icon } from '@nyawave/baked-icons';
import type { ReactNode } from 'react';
import { COMPARISON } from '@/lib/content';
import { HOME_FAQ } from '@/lib/faq';
import { Faq } from './faq';
import { CopyPromptButton } from './copy';
import { LoadTimeline } from './load-timeline';
import { Playground } from './playground';
import { SetupTabs } from './setup-tabs';

export function PlaygroundSection() {
  return (
    <section id="playground" className="wrap section" aria-labelledby="playground-title">
      <div className="section-head">
        <h2 id="playground-title" className="disp h2">
          Edit the JSX, watch the icon
        </h2>
        <p className="lead">
          Click a highlighted value to change it. On the right is what the build puts in your bundle: the icon data
          becomes a constant, the props stay as they are.
        </p>
      </div>
      <Playground />
    </section>
  );
}

export function HowSection() {
  return (
    <section id="how" className="wrap section" aria-labelledby="how-title">
      <div className="section-head">
        <h2 id="how-title" className="disp h2" style={{ maxWidth: '30ch' }}>
          Why Iconify icons flicker in React, frame by frame
        </h2>
        <p className="lead">
          Two server-rendered pages with the same menu. The only difference is where the icon data lives. Press play or
          drag the timeline.
        </p>
      </div>
      <LoadTimeline />
      <p className="tl-foot">Timings are illustrative. On a slow connection the API request takes longer, and the gap grows.</p>
    </section>
  );
}

export function SetupSection() {
  return (
    <section id="setup" className="wrap section" aria-labelledby="setup-title">
      <SetupTabs
        heading={
          <h2 id="setup-title" className="disp h2">
            Setup takes one config change
          </h2>
        }
      />
      <p className="section-links">
        Step-by-step guides: <a href="/docs/next">Next.js with SSR and Server Components</a> ·{' '}
        <a href="/docs/vite">Vite + React</a>
      </p>
    </section>
  );
}

const FEATURES = {
  network: {
    icon: <Icon icon="lucide:wifi-off" width={22} />,
    title: 'No network for icons',
    text: 'Icons are in the server-rendered HTML. Nothing waits on api.iconify.design, and the page works offline.',
  },
  rsc: {
    icon: <Icon icon="lucide:server" width={22} />,
    title: 'Server Components',
    text: '<Icon> has no state and no effects, so it needs no "use client". SVG ids are deterministic, so hydration matches.',
  },
  treeshake: {
    icon: <Icon icon="lucide:scissors" width={22} />,
    title: 'Only what you use',
    text: 'Each icon becomes a constant in the module that uses it and tree-shakes like any other code.',
  },
  sets: {
    icon: <Icon icon="lucide:package" width={22} />,
    title: 'Any Iconify set',
    text: 'Over 200 000 icons, plus your own IconifyJSON. The runtime is about 2 kB gzipped plus @iconify/utils.',
  },
};

const CAVEATS = [
  'Icon names have to be known at build time: string literals, or ?: and || and ?? between them. Names from a CMS? Bake the candidates and register them with addIcons().',
  'Files in node_modules are not transformed. A component library should bake its icons in its own build.',
  'Re-export Icon from your own module? Add that module to the sources option.',
  'Requires React 18+ and Node.js 20+. The built-in integrations need Vite 5+ or Next.js 14+.',
];

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="card feature">
      <span className="feature-icon">{icon}</span>
      <h3 className="disp h3">{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function WhySection() {
  return (
    <section id="why" className="wrap section" aria-labelledby="why-title">
      <div className="section-head">
        <h2 id="why-title" className="disp h2">
          What changes when you switch
        </h2>
        <p className="lead" style={{ maxWidth: '58ch' }}>
          Four things get better right away. One card of things to check first.
        </p>
      </div>
      <div className="why">
        <Feature {...FEATURES.network} />
        <Feature {...FEATURES.rsc} />
        <div className="why-tall">
          <h3 className="disp h3">Before you switch</h3>
          <ul className="caveats">
            {CAVEATS.map((text) => (
              <li key={text}>
                <Icon icon="lucide:info" width={20} />
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <Feature {...FEATURES.treeshake} />
        <Feature {...FEATURES.sets} />
      </div>
    </section>
  );
}

export function MigrateSection() {
  return (
    <section id="migrate" className="wrap section" aria-labelledby="migrate-title">
      <h2 id="migrate-title" className="disp h2">
        Coming from @iconify/react, change the import
      </h2>
      <div className="migrate">
        <pre className="code migrate-code">
          <span className="del">- import {'{ Icon }'} from &apos;@iconify/react&apos;;</span>
          <span className="add">+ import {'{ Icon }'} from &apos;@nyawave/baked-icons&apos;;</span>
          <span className="diff-body">
            {'\n  '}
            <span className="k">export function</span> Nav() {'{\n    '}
            <span className="k">return</span> ({'\n      <nav>\n        <Icon icon='}
            <span className="s">&quot;mdi:home&quot;</span>
            {' width={24} />\n        <Icon icon='}
            <span className="s">&quot;lucide:bell&quot;</span> color=<span className="s">&quot;tomato&quot;</span>
            {' />\n      </nav>\n    );\n  }'}
          </span>
        </pre>
        <div className="migrate-copy">
          <p>
            Props behave the same, because rendering goes through @iconify/utils, like in @iconify/react. The transform
            also understands these forms:
          </p>
          <ul className="forms">
            <li className="code-font">{"icon={open ? 'mdi:menu-open' : 'mdi:menu'}"}</li>
            <li className="code-font">{"icon={custom ?? 'mdi:help'}"}</li>
            <li className="code-font">{'import { Icon as I }'}</li>
            <li className="code-font">{"bakeIcon('lucide:flame')"}</li>
          </ul>
          <div className="migrate-actions">
            <CopyPromptButton
              className="hit btn btn-fg"
              label="Copy the migration prompt for your AI agent"
              copiedLabel="Prompt copied"
            />
            <a href="/migrate-from-iconify-react" className="text-link">
              Read the migration guide →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CompareSection() {
  return (
    <section id="compare" className="wrap section" aria-labelledby="compare-title">
      <h2 id="compare-title" className="disp h2">
        baked-icons vs @iconify/react vs unplugin-icons
      </h2>
      <div className="card compare">
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Feature</span>
              </th>
              <th scope="col" className="compare-us">
                @nyawave/baked-icons
              </th>
              <th scope="col">@iconify/react</th>
              <th scope="col">unplugin-icons</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="compare-us">{row.baked}</td>
                <td>{row.iconify}</td>
                <td>{row.unplugin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-links">
        In depth: <a href="/migrate-from-iconify-react">@iconify/react alternative</a> ·{' '}
        <a href="/unplugin-icons-alternative">unplugin-icons alternative</a>
      </p>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="wrap section" aria-labelledby="faq-title">
      <h2 id="faq-title" className="disp h2">
        Frequently asked questions
      </h2>
      <Faq items={HOME_FAQ} />
    </section>
  );
}
