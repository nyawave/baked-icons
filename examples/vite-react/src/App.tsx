import { Icon, InlineIcon, bakeIcon } from '@nyawave/baked-icons';
import { useState } from 'react';
import { weather, type WeatherIcon } from './icons.ts';

const logo = bakeIcon('lucide:flame');

export function App() {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState<WeatherIcon>('mdi:weather-sunny');

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32, display: 'grid', gap: 16 }}>
      <h1>
        <Icon icon={logo} color="tomato" inline /> baked-icons
      </h1>
      <p>
        Icons are <InlineIcon icon="lucide:package-check" /> inlined at build time — open the network tab: no icon
        requests, and they render on the very first paint.
      </p>

      <button onClick={() => setOpen((v) => !v)} style={{ width: 'fit-content' }}>
        <Icon icon={open ? 'mdi:menu-open' : 'mdi:menu'} width={20} inline /> toggle menu
      </button>

      <div>
        <Icon icon={weather[w]} width={48} />
        <select value={w} onChange={(e) => setW(e.target.value as WeatherIcon)}>
          {Object.keys(weather).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </div>

      <p>
        <Icon icon="mdi:arrow-right" rotate={1} /> <Icon icon="mdi:arrow-right" flip="horizontal" />{' '}
        <Icon icon="mdi:home" width="2em" title="Home" />
      </p>
    </main>
  );
}
