import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { bakeIcons, type BakedIcon } from '@nyawave/baked-icons';
import { ImageResponse } from 'next/og';
import { OG_SIZE } from './content';

const T = {
  bg: '#efefed',
  surface: '#ffffff',
  fg: '#18181b',
  muted: '#5f5f68',
  code: '#18191d',
  acc: '#2563eb',
  accSoft: '#e3ebfd',
  accInk: '#1d4ed8',
  codeStr: '#9ec1ff',
};

const ICONS = bakeIcons(['bi:logo', 'mdi:home', 'lucide:bell', 'ph:cat']);

function iconSrc(icon: BakedIcon, color: string): string {
  const body = icon.body.replaceAll('currentColor', color).replaceAll('var(--acc,#2563eb)', T.acc);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width ?? 16} ${icon.height ?? 16}">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function font(pkg: string, file: string): Promise<ArrayBuffer> {
  const buf = await readFile(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function fonts() {
  const [sans400, sans600, sans700, display600, mono400] = await Promise.all([
    font('funnel-sans', 'funnel-sans-latin-400-normal.woff'),
    font('funnel-sans', 'funnel-sans-latin-600-normal.woff'),
    font('funnel-sans', 'funnel-sans-latin-700-normal.woff'),
    font('funnel-display', 'funnel-display-latin-600-normal.woff'),
    font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
  ]);
  return [
    { name: 'Funnel Sans', data: sans400, weight: 400 as const, style: 'normal' as const },
    { name: 'Funnel Sans', data: sans600, weight: 600 as const, style: 'normal' as const },
    { name: 'Funnel Sans', data: sans700, weight: 700 as const, style: 'normal' as const },
    { name: 'Funnel Display', data: display600, weight: 600 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: mono400, weight: 400 as const, style: 'normal' as const },
  ];
}

const mono = 'JetBrains Mono';

function NavRow({ icon, label, on }: { icon: BakedIcon; label: string; on?: boolean }) {
  const color = on ? T.accInk : T.fg;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 14,
        background: on ? T.accSoft : 'transparent',
        color,
        fontSize: 20,
        fontWeight: on ? 600 : 400,
      }}
    >
      <img src={iconSrc(icon, color)} width={24} height={24} alt="" />
      {label}
    </div>
  );
}

function CodeLine({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', whiteSpace: 'pre' }}>
      {'<Icon icon='}
      <span style={{ color: T.codeStr }}>{`"${name}"`}</span>
      {' />'}
    </div>
  );
}

export async function renderOgImage(): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          background: T.bg,
          color: T.fg,
          fontFamily: 'Funnel Sans',
        }}
      >
        <div style={{ position: 'absolute', left: 64, top: 56, display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={iconSrc(ICONS['bi:logo'], T.fg)} width={34} height={34} alt="" />
          <div style={{ display: 'flex', fontSize: 30, letterSpacing: -0.3 }}>
            <span style={{ fontWeight: 700 }}>baked</span>
            <span style={{ fontWeight: 400, color: T.muted }}>icons</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 150,
            width: 600,
            fontFamily: 'Funnel Display',
            fontSize: 74,
            lineHeight: 1.02,
            fontWeight: 600,
            letterSpacing: -2.96,
          }}
        >
          Iconify icons, baked into your bundle
        </div>

        <div style={{ position: 'absolute', left: 64, bottom: 60, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ width: 560, fontSize: 25, lineHeight: 1.35, color: T.muted }}>
            Same &lt;Icon /&gt; as @iconify/react. No fetch, no flicker, works in Server Components.
          </div>
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 22px',
              borderRadius: 999,
              background: T.surface,
              fontFamily: mono,
              fontSize: 21,
            }}
          >
            <span style={{ color: T.muted }}>$</span>
            pnpm add @nyawave/baked-icons
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 56,
            top: 56,
            bottom: 56,
            width: 452,
            borderRadius: 32,
            background: T.code,
            color: '#e4e5ea',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0' }}>
            <span style={{ fontFamily: mono, fontSize: 17, color: '#c9cad1' }}>Nav.tsx</span>
            <span
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(80,200,140,0.14)',
                color: '#8fe3b4',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              1 line changed
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', fontFamily: mono, fontSize: 16.5, lineHeight: 1.75, padding: '4px 0' }}
          >
            <div style={{ display: 'flex', padding: '0 18px', color: '#ffa3a3', background: 'rgba(255,120,120,0.08)' }}>
              - from &apos;@iconify/react&apos;
            </div>
            <div style={{ display: 'flex', padding: '0 18px', color: '#8fe3b4', background: 'rgba(80,200,140,0.09)' }}>
              + from &apos;@nyawave/baked-icons&apos;
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 18px 0' }}>
              <CodeLine name="mdi:home" />
              <CodeLine name="lucide:bell" />
              <CodeLine name="ph:cat" />
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              borderRadius: 22,
              background: T.surface,
              color: T.fg,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 16, color: T.muted }}>In the HTML, first frame</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <NavRow icon={ICONS['mdi:home']} label="Home" on />
              <NavRow icon={ICONS['lucide:bell']} label="Alerts" />
              <NavRow icon={ICONS['ph:cat']} label="Profile" />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
