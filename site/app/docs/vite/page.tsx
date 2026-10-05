import { Code } from '@/components/code';
import { DocPage } from '@/components/doc-page';
import type { FaqItem } from '@/components/faq';
import { pageMetadata } from '@/lib/seo';

const PATH = '/docs/vite';
const TITLE = 'Iconify icons in Vite + React, baked at build time';
const DESCRIPTION =
  'Add one Vite plugin and every <Icon icon="mdi:home" /> is inlined at build time: no Iconify API requests, no flicker, custom IconifyJSON sets, SSR builds.';

export const metadata = pageMetadata({
  path: PATH,
  title: 'Iconify icons in Vite + React at build time | baked-icons',
  description: DESCRIPTION,
});

const FAQ: FaqItem[] = [
  {
    q: 'Does the plugin work with Vite SSR frameworks?',
    a: 'Yes. The plugin has no client-only restriction, so Vite runs it for the client bundle and for the server bundle alike. Frameworks built on Vite, such as React Router in framework mode, get the same SVG on the server and in the browser.',
  },
  {
    q: 'Does it slow down the dev server?',
    a: 'Barely. The plugin skips files that do not mention @nyawave/baked-icons, and a single transformer caches each icon set after the first read. Adding a new icon in dev only re-transforms the file you edited.',
  },
  {
    q: 'Do I still need @iconify/react with Vite?',
    a: 'No. @nyawave/baked-icons provides Icon and InlineIcon with the same props, so you can remove @iconify/react once the imports are switched.',
  },
];

export default function ViteGuide() {
  return (
    <DocPage
      path={PATH}
      crumb="Vite guide"
      title={TITLE}
      description={DESCRIPTION}
      lead={
        <>
          The Vite plugin replaces every <code>icon=&quot;prefix:name&quot;</code> with the icon data while Vite
          transforms your modules. You keep the @iconify/react API, and the browser never asks{' '}
          <code>api.iconify.design</code> for anything.
        </>
      }
      toc={[
        { id: 'install', label: 'Install' },
        { id: 'config', label: 'Configure vite.config.ts' },
        { id: 'usage', label: 'Use <Icon>' },
        { id: 'what-gets-baked', label: 'What gets baked' },
        { id: 'custom-sets', label: 'Custom icon sets' },
        { id: 'ssr', label: 'SSR on Vite' },
        { id: 'options', label: 'Options' },
        { id: 'output', label: 'What ends up in the bundle' },
        { id: 'troubleshooting', label: 'Troubleshooting' },
      ]}
      faq={FAQ}
    >
      <h2 id="install">Install</h2>
      <p>
        Install the package and an <code>@iconify-json/&lt;prefix&gt;</code> package for every icon set you use. The
        sets are only read during the build, so they go to <code>devDependencies</code>.
      </p>
      <Code lang="sh">{`
pnpm add @nyawave/baked-icons
pnpm add -D @iconify-json/mdi @iconify-json/lucide @iconify-json/ph
`}</Code>
      <p>
        Prefer individual sets: <code>@iconify/json</code> contains all 200 000+ icons and weighs hundreds of
        megabytes, which only slows down installs. Requirements: Vite 5 or newer, React 18 or newer, Node.js 20 or
        newer.
      </p>

      <h2 id="config">Configure vite.config.ts</h2>
      <Code file="vite.config.ts">{`
import react from '@vitejs/plugin-react';
import bakedIcons from '@nyawave/baked-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [bakedIcons(), react()],
});
`}</Code>
      <p>
        The plugin runs with <code>enforce: &quot;pre&quot;</code>, so it sees your original JSX before the React
        plugin compiles it, and its position in the array does not matter. Icon sets are resolved from Vite&apos;s{' '}
        <code>root</code>, which is what you want in monorepos.
      </p>

      <h2 id="usage">Use &lt;Icon&gt;</h2>
      <Code file="src/App.tsx">{`
import { Icon, InlineIcon } from '@nyawave/baked-icons';

export function App() {
  return (
    <main>
      <h1><Icon icon="mdi:home" width={32} /> Dashboard</h1>
      <Icon icon="ph:cat" rotate={1} flip="horizontal" color="tomato" />
      <p>Baked with <InlineIcon icon="lucide:flame" /> love</p>
    </main>
  );
}
`}</Code>
      <p>
        After the transform the file defines <code>$bi_mdi_home</code>, <code>$bi_ph_cat</code> and{' '}
        <code>$bi_lucide_flame</code> once at the top and passes them to <code>&lt;Icon&gt;</code>. Each constant is a
        few hundred bytes and only exists in the chunk that renders it, so code splitting and tree-shaking work as
        usual. <code>InlineIcon</code> is <code>Icon</code> with <code>vertical-align: -0.125em</code>, so it sits on
        the text baseline.
      </p>

      <h2 id="what-gets-baked">What gets baked</h2>
      <p>
        The transform bakes the <code>icon</code> prop of <code>Icon</code> and <code>InlineIcon</code>, and the
        arguments of <code>bakeIcon()</code> and <code>bakeIcons()</code>, when the value is known at build time:
      </p>
      <ul>
        <li>
          a string literal: <code>icon=&quot;mdi:home&quot;</code> or <code>icon=&#123;&apos;mdi:home&apos;&#125;</code>
        </li>
        <li>
          a conditional: <code>icon=&#123;open ? &apos;mdi:menu-open&apos; : &apos;mdi:menu&apos;&#125;</code>
        </li>
        <li>
          a fallback: <code>icon=&#123;custom ?? &apos;mdi:help&apos;&#125;</code> (the literal part is baked)
        </li>
        <li>
          renamed and namespace imports: <code>import &#123; Icon as I &#125;</code>,{' '}
          <code>import * as BI</code>
        </li>
      </ul>
      <p>
        Names that only exist at runtime fall back to the registry. Bake the candidates with{' '}
        <code>bakeIcons([...])</code> and either index the returned object, or pass it to <code>addIcons()</code> and
        keep passing strings.
      </p>

      <h2 id="custom-sets">Custom icon sets</h2>
      <p>
        In Vite you can pass an IconifyJSON object directly, or a path to a JSON file relative to the project root.
        Tools like Iconify Tools can turn a folder of SVG files into IconifyJSON.
      </p>
      <Code file="vite.config.ts">{`
bakedIcons({
  iconSets: {
    brand: './src/icons/brand.json',
    app: { prefix: 'app', icons: { star: { body: '<path d="..."/>', width: 10, height: 10 } } },
  },
});
`}</Code>
      <p>
        Then use them like any other set: <code>&lt;Icon icon=&quot;brand:logo&quot; /&gt;</code>.
      </p>

      <h2 id="ssr">SSR on Vite</h2>
      <p>
        Vite applies the plugin to the server build as well, so server-rendered HTML already contains the{' '}
        <code>&lt;svg&gt;</code>. <code>&lt;Icon&gt;</code> builds SVG ids from <code>useId()</code>, which keeps the
        server and client markup identical, so there is no hydration warning and no flash between the server HTML and
        the hydrated page.
      </p>

      <h2 id="options">Options</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Default</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sources</code></td>
              <td><code>[&apos;@nyawave/baked-icons&apos;]</code></td>
              <td>Modules whose Icon and helpers are recognised. Add your own re-export here.</td>
            </tr>
            <tr>
              <td><code>iconSets</code></td>
              <td><code>&#123;&#125;</code></td>
              <td>Custom IconifyJSON sets by prefix, as objects or file paths.</td>
            </tr>
            <tr>
              <td><code>onMissing</code></td>
              <td><code>&apos;error&apos;</code></td>
              <td>Fail the build, warn or ignore when an icon or set is not found.</td>
            </tr>
            <tr>
              <td><code>keepName</code></td>
              <td><code>true</code></td>
              <td>Keep the name in baked data for iconify--prefix classes and readable devtools.</td>
            </tr>
            <tr>
              <td><code>root</code></td>
              <td>Vite root</td>
              <td>Where icon sets and relative iconSets paths are resolved from.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="output">What ends up in the bundle</h2>
      <p>
        The transform is a source-to-source rewrite with a source map, so stack traces and breakpoints still point at
        your code. For the component above, the module that Vite hands to the React plugin looks like this:
      </p>
      <Code file="src/App.tsx (after the transform)">{`
import { Icon } from '@nyawave/baked-icons';
const $bi_mdi_home = {"body":"<path fill=\\"currentColor\\" d=\\"M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z\\"/>","name":"mdi:home","width":24,"height":24};

export function App() {
  return <h1><Icon icon={$bi_mdi_home} width={32} /> Dashboard</h1>;
}
`}</Code>
      <p>
        The same icon used twice in one module is defined once. An icon used in two lazily loaded routes is defined in
        each of their chunks, so a route never pulls icon data it does not render. Nothing from the transform itself
        reaches the browser: the runtime is the <code>&lt;Icon&gt;</code> component, about 2 kB gzipped plus{' '}
        <code>@iconify/utils</code>.
      </p>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <ul>
        <li>
          <strong>The build stops with a missing icon or icon set.</strong> That is the default{' '}
          <code>onMissing: &quot;error&quot;</code>, which catches typos before they ship. Install the{' '}
          <code>@iconify-json/&lt;prefix&gt;</code> package next to your Vite config or fix the name.
        </li>
        <li>
          <strong>An icon renders nothing and the console warns about it.</strong> The name was computed at runtime,
          so it could not be baked. Use a literal, a conditional between literals, or <code>bakeIcons()</code>.
        </li>
        <li>
          <strong>Icons from a re-exported component are not baked.</strong> Add your module to{' '}
          <code>sources</code>, for example <code>bakedIcons(&#123; sources: [&apos;@nyawave/baked-icons&apos;, &apos;@/ui/icon&apos;] &#125;)</code>.
        </li>
        <li>
          <strong>Icons inside a dependency are not baked.</strong> Files in <code>node_modules</code> are never
          transformed. A component library should run the transform in its own build.
        </li>
      </ul>
    </DocPage>
  );
}
