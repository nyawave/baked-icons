import { AGENT_PROMPT, DESCRIPTION, GUIDES, NPM_URL, PACKAGE, REPO_URL, SITE_URL } from '@/lib/content';

export const dynamic = 'force-static';

const body = `# baked-icons

> ${DESCRIPTION}

${PACKAGE} keeps the @iconify/react API (\`<Icon icon="mdi:home" />\`, 200 000+ Iconify icons, one string prop) but a bundler transform inlines the icon data at build time. Icons are in the server-rendered HTML on first paint, there are no requests to api.iconify.design, and <Icon> works in React Server Components without "use client".

- Site: ${SITE_URL}/
- Repository and full README: ${REPO_URL}
- npm: ${NPM_URL}
- License: MIT

## Guides

${GUIDES.map((g) => `- [${g.title}](${SITE_URL}${g.href}): ${g.summary}`).join('\n')}

## Install

\`\`\`sh
pnpm add ${PACKAGE}
pnpm add -D @iconify-json/mdi @iconify-json/lucide   # the icon sets you use
pnpm add -D @iconify/json                           # or every set at once
\`\`\`

Requires React 18+ and Node.js 20+. Built-in integrations need Vite 5+ or Next.js 14+.

## Setup (one config change)

Next.js (Turbopack and \`next build --webpack\`):

\`\`\`ts
// next.config.ts
import { withBakedIcons } from '${PACKAGE}/next';
export default withBakedIcons({ reactStrictMode: true });
\`\`\`

Vite:

\`\`\`ts
// vite.config.ts
import bakedIcons from '${PACKAGE}/vite';
export default defineConfig({ plugins: [bakedIcons(), react()] });
\`\`\`

webpack: add \`{ loader: '${PACKAGE}/loader' }\` for \`/\\.[cm]?[jt]sx?$/\`, excluding node_modules, last in the \`use\` array (runs before TS/Babel/SWC).

Anything else: \`createTransformer({ root }).transform(code, id)\` from \`${PACKAGE}/transform\` returns \`null\` or \`{ code, map, icons }\`.

## API

- \`<Icon icon="prefix:name" />\` and \`<InlineIcon />\` (inline defaults to true). Props: \`width\`, \`height\`, \`rotate\` (1|2|3 or "90deg"), \`flip\` ("horizontal" | "vertical" | "horizontal,vertical"), \`hFlip\`, \`vFlip\`, \`color\`, \`inline\`, \`title\` (otherwise aria-hidden), \`className\`, any SVG prop.
- \`bakeIcon('lucide:flame')\` returns icon data, inlined at build time.
- \`bakeIcons(['mdi:home', 'mdi:cog'])\` returns \`{ 'mdi:home': data, 'mdi:cog': data }\`, inlined at build time.
- \`addIcons(bakeIcons([...]))\`, \`addIcon(name, data)\`, \`addCollection(iconifyJson)\`: runtime registry for icon names that come from data. \`getIcon(name)\` looks one up.
- Options (all integrations): \`sources\` (modules that re-export Icon, default ['${PACKAGE}']), \`components\`, \`helpers\`, \`iconSets\` (custom IconifyJSON by prefix; paths only for Next.js), \`root\`, \`onMissing\` ('error' | 'warn' | 'ignore', default 'error'), \`keepName\`.

## What gets baked

The \`icon\` prop of Icon/InlineIcon and the arguments of bakeIcon/bakeIcons when the value is a string literal (\`"mdi:home"\`, \`{'mdi:home'}\`, a template without expressions), a conditional (\`open ? 'mdi:menu-open' : 'mdi:menu'\`), or \`||\` / \`??\` between literals. Renamed and namespace imports work. Anything else falls back to the runtime registry. Files in node_modules are not transformed.

## Migration prompt for AI agents

Paste this into Cursor, Claude Code or Codex to migrate a project from @iconify/react:

\`\`\`text
${AGENT_PROMPT}
\`\`\`
`;

export function GET() {
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
