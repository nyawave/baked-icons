import type { FaqItem } from '@/components/faq';

export const HOME_FAQ: FaqItem[] = [
  {
    q: 'Why do Iconify icons flicker in React?',
    a: '@iconify/react is a client component that loads icon data from api.iconify.design after it mounts. The server-rendered HTML has an empty spot where the icon goes, so the page paints without icons, waits for JavaScript and a network request, and then the icons pop in and shift the text next to them. baked-icons writes the SVG data into your bundle at build time, so the icon is already in the first HTML and nothing pops in.',
    link: { href: '/migrate-from-iconify-react', label: 'Fix the flicker by migrating' },
  },
  {
    q: 'Does @iconify/react work in React Server Components?',
    a: 'No. @iconify/react needs "use client" because it keeps state and fetches icon data in the browser. The <Icon> from @nyawave/baked-icons has no state and no effects, so it renders inside Server Components as is, and its SVG ids are deterministic, so hydration always matches.',
    link: { href: '/docs/next', label: 'Use icons in Server Components' },
  },
  {
    q: 'How do I render Iconify icons with SSR in Next.js?',
    a: 'Install @nyawave/baked-icons and the @iconify-json sets you use, then wrap next.config.ts with withBakedIcons(). It works with Turbopack (the Next.js 16 default) and with next build --webpack. Every <Icon icon="mdi:home" /> is baked during the build, so server-rendered and statically exported pages contain the finished SVG.',
    link: { href: '/docs/next', label: 'Read the Next.js guide' },
  },
  {
    q: 'What is a drop-in alternative to @iconify/react?',
    a: '@nyawave/baked-icons keeps the same <Icon icon="prefix:name" /> API and the same props (width, height, rotate, flip, color, inline, title), because rendering goes through @iconify/utils just like in @iconify/react. Migrating is one import change per file, plus one plugin in your bundler config.',
    link: { href: '/migrate-from-iconify-react', label: 'See the migration guide' },
  },
  {
    q: 'How is baked-icons different from unplugin-icons?',
    a: 'Both inline Iconify icons at build time. unplugin-icons turns every icon into its own component that you import from a virtual module (~icons/mdi/home) and supports many frameworks. baked-icons is React only and keeps the string API of @iconify/react, with runtime props like rotate and flip and a registry for icon names that come from data.',
    link: { href: '/unplugin-icons-alternative', label: 'Compare with unplugin-icons' },
  },
  {
    q: 'Will baking icons make my bundle bigger?',
    a: 'Only by the icons you actually use. Each icon becomes one constant in the module that renders it, usually 100 to 900 bytes, and tree-shakes like any other code. No icon set is ever shipped whole. The runtime is about 2 kB gzipped plus @iconify/utils.',
  },
  {
    q: 'Can I use icon names that come from a CMS or a database?',
    a: 'Yes. Names that are not string literals cannot be baked automatically, so bake the possible candidates with bakeIcons([...]) and register them with addIcons(). After that <Icon icon={item.icon} /> resolves them at runtime without any network request.',
  },
  {
    q: 'Which bundlers and frameworks are supported?',
    a: 'Vite 5+, Next.js 14+ with Turbopack or webpack, plain webpack through a loader, and any other build tool through a programmatic transform. It needs React 18+ and Node.js 20+. Static export (output: "export") works, this site is built that way.',
    link: { href: '/docs/vite', label: 'Read the Vite guide' },
  },
];
