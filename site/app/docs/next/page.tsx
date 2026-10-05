import { Code } from '@/components/code';
import { DocPage } from '@/components/doc-page';
import type { FaqItem } from '@/components/faq';
import { pageMetadata } from '@/lib/seo';

const PATH = '/docs/next';
const TITLE = 'Iconify icons in Next.js with SSR and Server Components';
const DESCRIPTION =
  'Render Iconify icons in Next.js without flicker: bake them at build time with withBakedIcons(), use <Icon> in Server Components, Turbopack and webpack.';

export const metadata = pageMetadata({
  path: PATH,
  title: 'Iconify icons in Next.js with SSR, no flicker | baked-icons',
  description: DESCRIPTION,
});

const FAQ: FaqItem[] = [
  {
    q: 'Do I need "use client" to render Iconify icons in Next.js?',
    a: 'Not with baked-icons. The <Icon> component has no state and no effects, so it renders in Server Components, in layouts and in pages without a client boundary. You only need "use client" for your own interactivity, and <Icon> works there too.',
  },
  {
    q: 'Does it work with Turbopack in Next.js 16?',
    a: 'Yes. withBakedIcons() registers a Turbopack loader rule for .ts, .tsx, .js and .jsx files and a webpack rule for next build --webpack, so the same config covers both bundlers. Files in node_modules are skipped.',
  },
  {
    q: 'Does it work with output: "export" and static hosting?',
    a: 'Yes. Icons are inlined while the pages are built, so the exported HTML already contains every SVG. This website is a Next.js static export built with baked-icons.',
  },
];

export default function NextGuide() {
  return (
    <DocPage
      path={PATH}
      crumb="Next.js guide"
      title={TITLE}
      description={DESCRIPTION}
      lead={
        <>
          Keep the <code>&lt;Icon icon=&quot;mdi:home&quot; /&gt;</code> API from @iconify/react, but get icons that
          are already in the server-rendered HTML. One wrapper in <code>next.config.ts</code> bakes every icon at build
          time, for the App Router and the Pages Router, with Turbopack or webpack.
        </>
      }
      toc={[
        { id: 'why', label: 'Why icons flicker in Next.js' },
        { id: 'install', label: 'Install' },
        { id: 'config', label: 'Configure next.config.ts' },
        { id: 'server-components', label: 'Server Components' },
        { id: 'client', label: 'Client Components' },
        { id: 'dynamic', label: 'Icon names from data' },
        { id: 'options', label: 'Custom sets and re-exports' },
        { id: 'static', label: 'Static export and OG images' },
        { id: 'troubleshooting', label: 'Troubleshooting' },
      ]}
      faq={FAQ}
    >
      <h2 id="why">Why Iconify icons flicker in Next.js</h2>
      <p>
        <code>@iconify/react</code> is a client component. On the server it does not have the icon data, so the HTML
        that Next.js streams to the browser contains an empty placeholder. After the JavaScript loads and the component
        mounts, it requests the SVG from <code>api.iconify.design</code>, and only then the icon appears. Every icon
        next to a label pushes that label to the side, which shows up as layout shift (CLS) and as a visible flash on
        every hard navigation.
      </p>
      <p>
        baked-icons moves that work to the build. A loader finds every <code>icon=&quot;prefix:name&quot;</code> in
        your code, reads the SVG from the locally installed Iconify JSON, and replaces the string with a constant. At
        runtime there is nothing to fetch, so the server HTML already has the finished <code>&lt;svg&gt;</code>.
      </p>

      <h2 id="install">Install</h2>
      <p>
        Install the package and the icon sets you use. Each Iconify prefix has its own package called{' '}
        <code>@iconify-json/&lt;prefix&gt;</code>, or you can install <code>@iconify/json</code> to get every set at
        once (it is large, so prefer individual sets in CI and on Vercel).
      </p>
      <Code lang="sh">{`
pnpm add @nyawave/baked-icons
pnpm add -D @iconify-json/mdi @iconify-json/lucide
`}</Code>
      <p>
        Icon sets are only read at build time, so they belong in <code>devDependencies</code>. In a monorepo, install
        them in the Next.js app itself: they are resolved from the app directory.
      </p>

      <h2 id="config">Configure next.config.ts</h2>
      <p>
        Wrap your existing config with <code>withBakedIcons()</code>. It adds a Turbopack rule (the default bundler in
        Next.js 16) and a webpack rule for <code>next build --webpack</code>, and keeps any rules you already have.
      </p>
      <Code file="next.config.ts">{`
import { withBakedIcons } from '@nyawave/baked-icons/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withBakedIcons(nextConfig);
`}</Code>
      <p>
        The loader only runs on your own files that import from <code>@nyawave/baked-icons</code>. Everything else,
        including <code>node_modules</code>, is left untouched, so the build cost is close to zero.
      </p>

      <h2 id="server-components">Use &lt;Icon&gt; in Server Components</h2>
      <p>
        <code>&lt;Icon&gt;</code> has no state and no effects, so it is a valid Server Component. Use it in layouts,
        pages and any server-only module without a <code>&quot;use client&quot;</code> boundary.
      </p>
      <Code file="app/layout.tsx">{`
import { Icon } from '@nyawave/baked-icons';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <a href="/"><Icon icon="mdi:home" /> Home</a>
          <a href="/settings"><Icon icon="lucide:settings" /> Settings</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
`}</Code>
      <p>
        At build time each name becomes a constant such as <code>$bi_mdi_home</code>, defined once at the top of the
        module. The props you pass (<code>width</code>, <code>height</code>, <code>rotate</code>, <code>flip</code>,{' '}
        <code>color</code>, <code>inline</code>, <code>title</code>) are applied at render time through{' '}
        <code>@iconify/utils</code>, the same library @iconify/react uses, so the output matches.
      </p>

      <h2 id="client">Client Components and conditional icons</h2>
      <p>
        Inside a Client Component nothing changes. The transform also understands conditionals and fallbacks between
        string literals, so toggles keep working without extra code:
      </p>
      <Code file="app/menu-button.tsx">{`
'use client';

import { Icon } from '@nyawave/baked-icons';
import { useState } from 'react';

export function MenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} aria-expanded={open}>
      <Icon icon={open ? 'mdi:menu-open' : 'mdi:menu'} />
    </button>
  );
}
`}</Code>
      <p>
        Both icons are baked. SVG ids inside icons are derived from <code>useId()</code>, so the markup rendered on the
        server and on the client is identical and hydration never reports a mismatch.
      </p>

      <h2 id="dynamic">Icon names from data</h2>
      <p>
        A name that only exists at runtime, for example from a CMS or a database, cannot be found by the transform. Bake
        the possible candidates into an object and pick from it. The object is typed, so a typo is a compile error:
      </p>
      <Code file="app/status-badge.tsx">{`
import { bakeIcons, Icon } from '@nyawave/baked-icons';

const statusIcons = bakeIcons(['mdi:check-circle', 'mdi:alert', 'mdi:close-circle']);

export function StatusBadge({ icon }: { icon: keyof typeof statusIcons }) {
  return <Icon icon={statusIcons[icon]} />;
}
`}</Code>
      <p>
        If the names are plain strings that you cannot type, register the same object with <code>addIcons()</code>{' '}
        and pass the string: <code>&lt;Icon icon=&#123;item.icon&#125; /&gt;</code> resolves it from the registry.
        Call <code>addIcons()</code> in the module that renders the icons, so it runs on the server and in the browser.
      </p>

      <h2 id="options">Custom icon sets and re-exports</h2>
      <p>
        Your own icons can live in an IconifyJSON file and be used with their own prefix. In Next.js the loader options
        must be serialisable, so pass a path relative to the project root:
      </p>
      <Code file="next.config.ts">{`
export default withBakedIcons(nextConfig, {
  iconSets: { brand: './icons/brand.json' },
  sources: ['@nyawave/baked-icons', '@/ui/icon'],
});
`}</Code>
      <p>
        <code>sources</code> is needed when you re-export <code>Icon</code> from your own module, such as a design
        system wrapper in <code>@/ui/icon</code>. The re-export has to keep the names <code>Icon</code>,{' '}
        <code>InlineIcon</code>, <code>bakeIcon</code> and <code>bakeIcons</code>.
      </p>

      <h2 id="static">Static export and OG images</h2>
      <p>
        With <code>output: &quot;export&quot;</code> the icons are inlined into the generated HTML, so the site works
        on any static host with no runtime at all. For Open Graph images rendered with <code>ImageResponse</code>, which
        cannot take raw SVG markup, turn the baked data into an image source:
      </p>
      <Code file="lib/og-icon.ts">{`
import { bakeIcon } from '@nyawave/baked-icons';

const home = bakeIcon('mdi:home');
const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \${home.width} \${home.height}">\${home.body}</svg>\`;

export const homeSrc = \`data:image/svg+xml,\${encodeURIComponent(svg.replaceAll('currentColor', '#18181b'))}\`;
`}</Code>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <ul>
        <li>
          <strong>The build fails with a missing icon.</strong> That is the default <code>onMissing: &quot;error&quot;</code>.
          Install the <code>@iconify-json/&lt;prefix&gt;</code> package or fix the name. Set{' '}
          <code>onMissing: &quot;warn&quot;</code> to downgrade it.
        </li>
        <li>
          <strong>An icon renders nothing and logs a warning.</strong> The name was not a string literal, so it was not
          baked. Use a literal, a conditional between literals, or <code>bakeIcons()</code>.
        </li>
        <li>
          <strong>Icons from a component library are missing.</strong> Files in <code>node_modules</code> are never
          transformed. A published library should bake its icons in its own build.
        </li>
      </ul>
    </DocPage>
  );
}
