'use client';

import { bakeIcons, Icon, type BakedIcon } from '@nyawave/baked-icons';
import { useState } from 'react';

const ICONS = bakeIcons([
  'mdi:home',
  'lucide:flame',
  'ph:cat',
  'tabler:bolt',
  'lucide:heart',
  'ph:planet',
  'mdi:pizza',
  'tabler:ghost',
]);
const NAMES = Object.keys(ICONS) as (keyof typeof ICONS)[];
const SIZES = [24, 48, 96, 160];
const FLIPS = ['none', 'horizontal', 'vertical'];
const COLORS = ['currentColor', '#e5484d', '#3e63dd', '#30a46c'];

const DEFAULTS = { icon: 0, size: 2, rotate: 0, flip: 0, color: 0 };
type Field = keyof typeof DEFAULTS;
const LENGTHS: Record<Field, number> = {
  icon: NAMES.length,
  size: SIZES.length,
  rotate: 4,
  flip: FLIPS.length,
  color: COLORS.length,
};

function describe(name: string, data: BakedIcon) {
  const body = JSON.stringify(data.body).slice(1, -1);
  return {
    constName: `$bi_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`,
    body: body.length > 64 ? `${body.slice(0, 63)}…` : body,
    width: data.width ?? 16,
    height: data.height ?? 16,
    bytes: JSON.stringify(data).length,
  };
}

export function Playground() {
  const [s, setS] = useState(DEFAULTS);
  const next = (field: Field) => setS((prev) => ({ ...prev, [field]: (prev[field] + 1) % LENGTHS[field] }));

  const name = NAMES[s.icon]!;
  const data = ICONS[name];
  const size = SIZES[s.size]!;
  const flip = FLIPS[s.flip]!;
  const color = COLORS[s.color]!;
  const info = describe(name, data);
  const props = ` width={${size}} rotate={${s.rotate}} flip="${flip}" color="${color}"`;

  return (
    <div className="card pg">
      <div className="pg-bar">
        <div className="code-font pg-jsx">
          &lt;Icon icon=
          <button type="button" className="tok hit" onClick={() => next('icon')} aria-label="Change icon">
            &quot;{name}&quot;
          </button>{' '}
          width={'{'}
          <button type="button" className="tok hit" onClick={() => next('size')} aria-label="Change width">
            {size}
          </button>
          {'}'} rotate={'{'}
          <button type="button" className="tok hit" onClick={() => next('rotate')} aria-label="Change rotate">
            {s.rotate}
          </button>
          {'}'} flip=
          <button type="button" className="tok hit" onClick={() => next('flip')} aria-label="Change flip">
            &quot;{flip}&quot;
          </button>{' '}
          color=
          <button type="button" className="tok hit" onClick={() => next('color')} aria-label="Change color">
            &quot;{color}&quot;
          </button>{' '}
          /&gt;
        </div>
        <button type="button" className="hit btn btn-soft pg-reset" onClick={() => setS(DEFAULTS)}>
          Reset
        </button>
      </div>

      <div className="two pg-grid">
        <div className="pg-view">
          <span className="pg-label">Rendered</span>
          <div className="pg-stage">
            <span className="grow pg-icon" style={{ width: size, height: size }}>
              <Icon
                icon={data}
                width="100%"
                height="100%"
                rotate={s.rotate}
                flip={flip === 'none' ? undefined : flip}
                color={color === 'currentColor' ? undefined : color}
                title={name}
              />
            </span>
          </div>
        </div>
        <div className="pg-code">
          <div className="pg-code-head">
            <span>In your bundle</span>
            <span>{info.bytes} bytes of icon data</span>
          </div>
          <div className="pg-code-body">
            <pre className="code wrapit">
              <span className="c">{'// added once at the top of the module'}</span>
              {'\n'}
              <span className="k">const</span> {info.constName} = {'{\n  body: '}
              <span className="s">&quot;{info.body}&quot;</span>
              {`,\n  width: ${info.width}, height: ${info.height},\n};`}
            </pre>
            <pre className="code wrapit">
              <span className="c">{'// your JSX, with the string swapped for the constant'}</span>
              {`\n<Icon icon={${info.constName}}${props} />`}
            </pre>
            <p className="pg-code-note">
              No request to api.iconify.design. Props are applied at render time, exactly like in @iconify/react.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
