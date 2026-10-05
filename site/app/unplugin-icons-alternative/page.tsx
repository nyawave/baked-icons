import { Code } from '@/components/code';
import { DocPage } from '@/components/doc-page';
import type { FaqItem } from '@/components/faq';
import { pageMetadata } from '@/lib/seo';

const PATH = '/unplugin-icons-alternative';
const TITLE = 'baked-icons vs unplugin-icons for React';
const DESCRIPTION =
  'An unplugin-icons alternative for React and Next.js that keeps the @iconify/react string API: <Icon icon="mdi:home" />, runtime props, dynamic names.';

export const metadata = pageMetadata({
  path: PATH,
  title: 'unplugin-icons alternative for React | baked-icons',
  description: DESCRIPTION,
});

const FAQ: FaqItem[] = [
  {
    q: 'Is baked-icons faster than unplugin-icons at runtime?',
    a: 'Both put the SVG data into your bundle at build time, so neither makes a network request and both render on the first frame. The runtime difference is small: baked-icons applies props like rotate and flip when it renders, unplugin-icons compiles a fixed SVG component per icon.',
  },
  {
    q: 'Can I use both in one project?',
    a: 'Yes. They transform different things: unplugin-icons resolves ~icons/* imports, baked-icons rewrites the icon prop of its own Icon component. Nothing stops you from moving over gradually.',
  },
  {
    q: 'Does baked-icons support Vue, Svelte or Solid?',
    a: 'No, it is a React library: the runtime is a React component. For other frameworks unplugin-icons is the better choice.',
  },
];

const ROWS: [label: string, baked: string, unplugin: string][] = [
  ['How you use an icon', '<Icon icon="mdi:home" />', "import IconHome from '~icons/mdi/home'"],
  ['Where icon data comes from', 'Your bundle, baked at build time', 'Your bundle, compiled at build time'],
  ['First paint and SSR', 'Icon in the HTML, no request', 'Icon in the HTML, no request'],
  ['React Server Components', 'Yes', 'Yes'],
  ['Frameworks', 'React', 'Vue, React, Preact, Solid, Svelte, Astro and more'],
  ['rotate, flip, color as props', 'Yes, at render time', 'Through CSS or build-time customisation'],
  ['Icon names from data', 'bakeIcons() map or runtime registry', 'Import each icon and build a map'],
  ['API compatible with @iconify/react', 'Yes, change the import', 'No, every usage is rewritten'],
  ['Auto-install of icon sets', 'No, install @iconify-json/* yourself', 'Yes, optional'],
];

export default function UnpluginAlternative() {
  return (
    <DocPage
      path={PATH}
      crumb="unplugin-icons alternative"
      title={TITLE}
      description={DESCRIPTION}
      lead={
        <>
          unplugin-icons and baked-icons solve the same problem, Iconify icons without a runtime API, in two different
          ways. unplugin-icons turns each icon into a component you import. baked-icons keeps one{' '}
          <code>&lt;Icon&gt;</code> component with a string prop and bakes the data in place.
        </>
      }
      toc={[
        { id: 'difference', label: 'The core difference' },
        { id: 'table', label: 'Side by side' },
        { id: 'pick-baked', label: 'When to pick baked-icons' },
        { id: 'pick-unplugin', label: 'When to pick unplugin-icons' },
        { id: 'dynamic', label: 'Dynamic icons and TypeScript' },
        { id: 'switch', label: 'Switching over' },
      ]}
      faq={FAQ}
    >
      <h2 id="difference">The core difference</h2>
      <p>
        With unplugin-icons every icon is a module. The import path is the icon name, and the plugin compiles it into a
        small framework component at build time:
      </p>
      <Code file="unplugin-icons">{`
import IconHome from '~icons/mdi/home';
import IconBell from '~icons/lucide/bell';

<IconHome />
<IconBell style={{ color: 'tomato' }} />
`}</Code>
      <p>
        baked-icons keeps the API of @iconify/react. The icon is a string prop, and the bundler plugin replaces that
        string with the icon data in the same file:
      </p>
      <Code file="baked-icons">{`
import { Icon } from '@nyawave/baked-icons';

<Icon icon="mdi:home" />
<Icon icon="lucide:bell" color="tomato" rotate={1} />
`}</Code>
      <p>
        Both end with the SVG in your bundle and in the server HTML. The difference is how you write code, how you
        customise icons, and what happens when the name is not known in advance.
      </p>

      <h2 id="table">Side by side</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">baked-icons</th>
              <th scope="col">unplugin-icons</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, baked, unplugin]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{baked}</td>
                <td>{unplugin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="pick-baked">When to pick baked-icons</h2>
      <ul>
        <li>
          <strong>You are on @iconify/react today.</strong> The migration is one import per file, not a rewrite of every
          icon into an import. See the <a href="/migrate-from-iconify-react">migration guide</a>.
        </li>
        <li>
          <strong>You change icons with props.</strong> <code>rotate</code>, <code>flip</code>, <code>width</code> and{' '}
          <code>color</code> work at render time, with the same behaviour as @iconify/react.
        </li>
        <li>
          <strong>Icon names come from data.</strong> <code>bakeIcons([...])</code> gives you a typed map of
          candidates, and <code>addIcons()</code> lets <code>&lt;Icon icon=&#123;name&#125; /&gt;</code> resolve
          plain strings at runtime.
        </li>
        <li>
          <strong>You use Next.js with Turbopack.</strong> <code>withBakedIcons()</code> configures Turbopack and
          webpack in one call. See the <a href="/docs/next">Next.js guide</a>.
        </li>
      </ul>

      <h2 id="pick-unplugin">When to pick unplugin-icons</h2>
      <ul>
        <li>
          <strong>You are not on React</strong>, or you share icons across Vue, Svelte, Solid and React apps.
        </li>
        <li>
          <strong>You prefer explicit imports</strong>, so that every icon is a visible dependency of the file, or you
          use auto-import resolvers.
        </li>
        <li>
          <strong>You want icon sets installed for you</strong> when you first use a prefix.
        </li>
      </ul>

      <h2 id="dynamic">Dynamic icons and TypeScript</h2>
      <p>
        The biggest practical difference shows up when the icon depends on data, for example a status or a menu
        loaded from an API. With unplugin-icons every candidate is a separate import, and you write the map yourself:
      </p>
      <Code file="unplugin-icons">{`
import IconCheck from '~icons/mdi/check-circle';
import IconAlert from '~icons/mdi/alert';
import IconClose from '~icons/mdi/close-circle';

const statusIcons = { ok: IconCheck, warning: IconAlert, error: IconClose };
const StatusIcon = statusIcons[status];
<StatusIcon />
`}</Code>
      <p>With baked-icons the map is one call, typed by the names you pass:</p>
      <Code file="baked-icons">{`
import { bakeIcons, Icon } from '@nyawave/baked-icons';

const statusIcons = bakeIcons(['mdi:check-circle', 'mdi:alert', 'mdi:close-circle']);
<Icon icon={statusIcons['mdi:alert']} rotate={2} />
`}</Code>
      <p>
        For TypeScript, unplugin-icons needs its virtual module types added to <code>tsconfig.json</code> (for React,{' '}
        <code>unplugin-icons/types/react</code>). baked-icons is a regular package with its own declarations, so there
        is nothing to configure, and the icon prop accepts both strings and baked data.
      </p>

      <h2 id="switch">Switching from unplugin-icons</h2>
      <p>
        Replace each icon import with a string, keep the props, and add the baked-icons plugin. You can do it one file
        at a time, because the two plugins do not interfere:
      </p>
      <Code file="Nav.tsx">{`
// before
import IconHome from '~icons/mdi/home';
<IconHome className="nav-icon" />

// after
import { Icon } from '@nyawave/baked-icons';
<Icon icon="mdi:home" className="nav-icon" />
`}</Code>
    </DocPage>
  );
}
