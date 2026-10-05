import pkg from '@nyawave/baked-icons/package.json';

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const origin = process.env.SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');
export const SITE_URL = origin.replace(/\/+$/, '');

export const PACKAGE = '@nyawave/baked-icons';
export const VERSION = pkg.version;
export const REPO_URL = 'https://github.com/nyawave/baked-icons';
export const NPM_URL = 'https://www.npmjs.com/package/@nyawave/baked-icons';
export const ORG = { name: 'nyawave', url: 'https://github.com/nyawave', logo: 'https://avatars.githubusercontent.com/u/253715786?v=4' };

export const TITLE = 'Build-time Iconify icons for React & Next.js | baked-icons';
export const SOCIAL_TITLE = 'baked-icons: Iconify icons, baked into your bundle';
export const DESCRIPTION =
  'Drop-in @iconify/react replacement for React and Next.js. Iconify icons are inlined at build time: SSR-ready, Server Components, no flicker, no API calls.';

export const UPDATED = '2026-10-05';

export const GUIDES = [
  {
    href: '/docs/next',
    nav: 'Next.js',
    footer: 'Next.js guide',
    title: 'Iconify icons in Next.js with SSR and Server Components',
    summary: 'Set up withBakedIcons() for Turbopack and webpack, use <Icon> in Server Components, ship icons in the first HTML.',
  },
  {
    href: '/docs/vite',
    nav: 'Vite',
    footer: 'Vite guide',
    title: 'Iconify icons in Vite + React, baked at build time',
    summary: 'Add the Vite plugin, bake icons into the bundle, use custom IconifyJSON sets and SSR frameworks built on Vite.',
  },
  {
    href: '/migrate-from-iconify-react',
    nav: 'Migrate',
    footer: 'Migration guide',
    title: 'Migrate from @iconify/react',
    summary: 'Swap one import, keep every prop, and stop icons from flickering after hydration.',
  },
  {
    href: '/unplugin-icons-alternative',
    nav: 'vs unplugin-icons',
    footer: 'unplugin-icons alternative',
    title: 'baked-icons vs unplugin-icons',
    summary: 'Both bake Iconify icons at build time. How the APIs differ and when to pick which one.',
  },
] as const;

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT =
  'baked-icons: Iconify icons, baked into your bundle. Same <Icon /> as @iconify/react, no fetch, no flicker.';

export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const PM_COMMANDS: Record<PackageManager, [add: string, addDev: string]> = {
  pnpm: ['pnpm add', 'pnpm add -D'],
  npm: ['npm i', 'npm i -D'],
  yarn: ['yarn add', 'yarn add -D'],
  bun: ['bun add', 'bun add -d'],
};

export function installCommand(pm: PackageManager): string {
  return `${PM_COMMANDS[pm][0]} ${PACKAGE}`;
}

export function installDevCommand(pm: PackageManager): string {
  return PM_COMMANDS[pm][1];
}

export const AGENT_PROMPT = [
  'Migrate this project from @iconify/react to @nyawave/baked-icons (https://github.com/nyawave/baked-icons). It has the same <Icon> API, but icons are inlined at build time.',
  '',
  '1. Use the package manager this project already uses. Install @nyawave/baked-icons. Find every icon prefix in the code (icon="prefix:name") and install @iconify-json/<prefix> for each one as a dev dependency. Remove @iconify/react.',
  '2. Configure the bundler:',
  "   - Next.js: wrap the config with withBakedIcons() from '@nyawave/baked-icons/next'. Works with Turbopack and webpack.",
  "   - Vite: add bakedIcons() from '@nyawave/baked-icons/vite' to plugins.",
  "   - webpack: add the '@nyawave/baked-icons/loader' rule so it runs before the TS/Babel/SWC loader (last in the use array).",
  "3. Replace every import from '@iconify/react' with '@nyawave/baked-icons'. Props (width, height, rotate, flip, color, inline, title) stay the same.",
  '4. Icon names must be string literals, or ?: / || / ?? between literals. Where a name comes from data, bake the candidates with bakeIcons([...]) and register them with addIcons().',
  '5. If Icon is re-exported from a local module, pass that module in the sources option of the plugin.',
  '6. Remove any "use client" that existed only because of @iconify/react.',
  '7. Run the build. A missing icon or icon set fails the build by default; install the set or fix the name.',
].join('\n');

export const COMPARISON: { label: string; baked: string; iconify: string; unplugin: string }[] = [
  { label: 'Icon API', baked: '<Icon icon="mdi:home" />', iconify: '<Icon icon="mdi:home" />', unplugin: "import from '~icons/mdi/home'" },
  { label: 'Icon data comes from', baked: 'Your bundle, at build time', iconify: 'Iconify API, at runtime', unplugin: 'Your bundle, at build time' },
  { label: 'Server Components', baked: 'Yes', iconify: 'No, client only', unplugin: 'Yes' },
  { label: 'rotate, flip and other props', baked: 'Yes', iconify: 'Yes', unplugin: 'Limited' },
  { label: 'Icon names from data', baked: 'Yes, via the registry', iconify: 'Yes, any icon', unplugin: 'No' },
  { label: 'Works without a third-party API', baked: 'Yes', iconify: 'No', unplugin: 'Yes' },
];
