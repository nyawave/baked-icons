import { Code } from '@/components/code';
import { CopyPromptButton } from '@/components/copy';
import { DocPage } from '@/components/doc-page';
import type { FaqItem } from '@/components/faq';
import { AGENT_PROMPT } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

const PATH = '/migrate-from-iconify-react';
const TITLE = 'Migrate from @iconify/react without the flicker';
const DESCRIPTION =
  'A drop-in @iconify/react alternative: same <Icon> API and props, icons baked at build time. Fix icon flicker and SSR in React and Next.js in one import.';

export const metadata = pageMetadata({
  path: PATH,
  title: '@iconify/react alternative without flicker | baked-icons',
  description: DESCRIPTION,
});

const FAQ: FaqItem[] = [
  {
    q: 'Will my icons look exactly the same after migrating?',
    a: 'Yes. Both packages render through @iconify/utils with the same icon data from the Iconify sets, so width, height, rotate, flip and color produce the same SVG. The only visible difference is that icons are there on the first frame.',
  },
  {
    q: 'Can I migrate one file at a time?',
    a: 'Yes. The two packages can live side by side. Switch the import in one file, build, and continue. Remove @iconify/react when no file imports it anymore.',
  },
  {
    q: 'What happens to my addIcon() and addCollection() calls?',
    a: 'They keep working: @nyawave/baked-icons exports addIcon(name, data) and addCollection(json) with the same shape. Most of them become unnecessary, because literal icon names are baked automatically.',
  },
];

const PROPS: [prop: string, status: string][] = [
  ['icon', 'Same. Strings are baked at build time; icon data objects work as before.'],
  ['width, height', 'Same, numbers or any CSS length.'],
  ['rotate', 'Same: 1 | 2 | 3 quarter turns, or "90deg", "25%".'],
  ['flip, hFlip, vFlip', 'Same.'],
  ['color', 'Same, sets CSS color; icons draw with currentColor.'],
  ['inline, InlineIcon', 'Same, adds vertical-align: -0.125em.'],
  ['title', 'Same. Without it the SVG is aria-hidden.'],
  ['className, style, SVG props, ref', 'Passed through to the <svg>.'],
  ['onLoad', 'Not needed: there is nothing to load.'],
  ['mode="style" | "bg" | "mask"', 'Not supported. Icons always render as inline SVG.'],
];

export default function MigrateGuide() {
  return (
    <DocPage
      path={PATH}
      crumb="Migrate from @iconify/react"
      title={TITLE}
      description={DESCRIPTION}
      lead={
        <>
          @nyawave/baked-icons is a drop-in replacement for @iconify/react. You keep{' '}
          <code>&lt;Icon icon=&quot;mdi:home&quot; /&gt;</code> and every prop, change one import, and the icons move
          from a runtime request into your bundle.
        </>
      }
      toc={[
        { id: 'why', label: 'Why icons flicker' },
        { id: 'steps', label: 'Migrate in five steps' },
        { id: 'props', label: 'Props compatibility' },
        { id: 'dynamic', label: 'Dynamic icon names' },
        { id: 'agent', label: 'Migrate with an AI agent' },
        { id: 'stay', label: 'When to stay on @iconify/react' },
      ]}
      faq={FAQ}
    >
      <h2 id="why">Why @iconify/react icons flicker</h2>
      <p>
        @iconify/react does not ship icon data. When an <code>&lt;Icon&gt;</code> mounts in the browser, it asks the
        Iconify API for the SVG and renders it when the response arrives. Server-rendered HTML therefore has no icon,
        the page paints without it, and a moment later every icon pops in and moves the text next to it. On a slow
        network the gap is easy to see, and it counts towards Cumulative Layout Shift. Because the component fetches in
        the browser, it is also client-only and cannot be used in React Server Components.
      </p>
      <p>
        baked-icons resolves the icon names while your app is built and inlines the SVG data, so the first HTML already
        contains the icons and there is no request to make.
      </p>

      <h2 id="steps">Migrate in five steps</h2>
      <h3>1. Install the package and your icon sets</h3>
      <p>
        Look for every prefix you use (<code>mdi</code>, <code>lucide</code>, <code>ph</code>…) and install its{' '}
        <code>@iconify-json</code> package. The build reads icons from these packages instead of the API.
      </p>
      <Code lang="sh">{`
pnpm add @nyawave/baked-icons
pnpm add -D @iconify-json/mdi @iconify-json/lucide
`}</Code>

      <h3>2. Add the plugin for your bundler</h3>
      <p>
        Next.js: wrap the config with <code>withBakedIcons()</code> (<a href="/docs/next">Next.js guide</a>). Vite: add{' '}
        <code>bakedIcons()</code> to plugins (<a href="/docs/vite">Vite guide</a>). webpack: add the{' '}
        <code>@nyawave/baked-icons/loader</code> rule before your TypeScript or Babel loader.
      </p>

      <h3>3. Change the import</h3>
      <Code file="Nav.tsx">{`
// before
import { Icon } from '@iconify/react';
// after
import { Icon } from '@nyawave/baked-icons';
`}</Code>
      <p>For a whole codebase a single replace is enough:</p>
      <Code lang="sh">{`
grep -rl "'@iconify/react'" src | xargs sed -i "s#'@iconify/react'#'@nyawave/baked-icons'#g"
`}</Code>

      <h3>4. Remove client boundaries that existed only for icons</h3>
      <p>
        If a component had <code>&quot;use client&quot;</code> just because it rendered @iconify/react, remove it.{' '}
        <code>&lt;Icon&gt;</code> from baked-icons renders in Server Components.
      </p>

      <h3>5. Build and remove @iconify/react</h3>
      <p>
        Run the build. A wrong name or a missing icon set fails the build by default, so you find typos before your
        users do. When nothing imports @iconify/react anymore, uninstall it.
      </p>

      <h2 id="props">Props compatibility</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">@iconify/react prop</th>
              <th scope="col">In baked-icons</th>
            </tr>
          </thead>
          <tbody>
            {PROPS.map(([prop, status]) => (
              <tr key={prop}>
                <td>
                  <code>{prop}</code>
                </td>
                <td>{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="dynamic">Dynamic icon names</h2>
      <p>
        With @iconify/react any string works because the icon is fetched on demand. A build step can only bake names
        it can see, so literals, conditionals between literals and <code>??</code> / <code>||</code> fallbacks are
        baked automatically. For names that come from data, bake the candidates once:
      </p>
      <Code file="menu.tsx">{`
import { addIcons, bakeIcons, Icon } from '@nyawave/baked-icons';

addIcons(bakeIcons(['mdi:home', 'mdi:account', 'mdi:cog']));

export function MenuItem({ item }: { item: { icon: string; label: string } }) {
  return <a><Icon icon={item.icon} /> {item.label}</a>;
}
`}</Code>
      <p>
        A string that is neither baked nor registered renders nothing and logs a one-time warning in development, so
        a missing candidate is easy to spot.
      </p>

      <h2 id="agent">Migrate with an AI agent</h2>
      <p>
        Paste this prompt into Cursor, Claude Code or Codex. It installs the right icon sets, configures the bundler,
        swaps the imports and runs the build.
      </p>
      <pre className="code wrapit doc-prompt">{AGENT_PROMPT}</pre>
      <CopyPromptButton className="hit btn btn-fg" label="Copy the migration prompt" copiedLabel="Prompt copied" />

      <h2 id="stay">When to stay on @iconify/react</h2>
      <p>
        If users can pick any of the 200 000+ icons at runtime, for example in an icon picker, a runtime loader is the
        right tool: you cannot bake what you do not know at build time. You can also avoid the flicker in
        @iconify/react itself by registering icon data with <code>addCollection()</code>, but then you decide by hand
        which sets to ship, and whole collections end up in the bundle instead of the icons you use. baked-icons
        automates exactly that part.
      </p>
    </DocPage>
  );
}
