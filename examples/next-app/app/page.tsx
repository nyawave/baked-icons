// This is a React Server Component — no "use client" needed.
// Icons are baked at build time, so they are part of the server-rendered HTML.
import { Icon, InlineIcon } from '@nyawave/baked-icons';
import { MenuButton } from './menu-button.tsx';

export default function Page() {
  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1>
        <Icon icon="lucide:flame" color="tomato" inline /> baked-icons + Next.js (Turbopack)
      </h1>
      <p>
        Rendered on the server <InlineIcon icon="mdi:server" /> with the SVG already in the HTML — no client
        request, no layout shift.
      </p>
      <MenuButton />
      <p>
        <Icon icon="mdi:arrow-right" rotate={1} /> <Icon icon="mdi:arrow-right" flip="horizontal" />{' '}
        <Icon icon="mdi:home" width="2em" title="Home" />
      </p>
    </main>
  );
}
