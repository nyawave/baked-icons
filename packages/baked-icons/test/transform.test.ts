import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { transform, createTransformer } from '../src/transform.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const opts = { root };

describe('transform', () => {
  it('bakes string literal icon props on <Icon>', () => {
    const out = transform(
      `import { Icon } from '@nyawave/baked-icons';
export const A = () => <Icon icon="mdi:home" width={24} />;`,
      '/app/A.tsx',
      opts,
    );
    expect(out).not.toBeNull();
    expect(out!.icons).toEqual(['mdi:home']);
    expect(out!.code).toContain('const $bi_mdi$home = {"body":"<path');
    expect(out!.code).toContain('icon={$bi_mdi$home}');
    expect(out!.code).toContain('"name":"mdi:home"');
    expect(out!.map.mappings.length).toBeGreaterThan(0);
  });

  it('respects renamed imports, InlineIcon, namespace imports and {"..."} syntax', () => {
    const out = transform(
      `"use client";
import { Icon as I, InlineIcon } from "@nyawave/baked-icons";
import * as BI from "@nyawave/baked-icons";
export const A = () => (
  <>
    <I icon={"mdi:home"} onClick={() => 1 > 0} />
    <InlineIcon icon='mdi:menu' />
    <BI.Icon icon="mdi:home" />
  </>
);`,
      '/app/A.tsx',
      opts,
    );
    expect(out!.icons.sort()).toEqual(['mdi:home', 'mdi:menu']);
    expect(out!.code.match(/\$bi_mdi\$home/g)!.length).toBe(3); // 1 decl + 2 uses
    // hoisted after the directive & imports
    expect(out!.code.indexOf('/* baked-icons */')).toBeGreaterThan(out!.code.indexOf('from "@nyawave/baked-icons";'));
    expect(out!.code.indexOf('"use client"')).toBe(0);
  });

  it('bakes conditional expressions', () => {
    const out = transform(
      `import { Icon } from '@nyawave/baked-icons';
export const A = ({ open }: { open: boolean }) => <Icon icon={open ? "mdi:menu-open" : "mdi:menu"} />;`,
      '/app/A.tsx',
      opts,
    );
    expect(out!.code).toContain('icon={open ? $bi_mdi$menu_open : $bi_mdi$menu}');
  });

  it('bakes bakeIcon() and bakeIcons() calls in plain .ts files', () => {
    const out = transform(
      `import { bakeIcon, bakeIcons } from '@nyawave/baked-icons';
export const home = bakeIcon("mdi:home");
export const all = bakeIcons(["mdi:home", "lucide:house"]);`,
      '/app/icons.ts',
      opts,
    );
    expect(out!.code).toContain('export const home = $bi_mdi$home;');
    expect(out!.code).toContain('export const all = {"mdi:home":$bi_mdi$home,"lucide:house":$bi_lucide$house};');
    expect(out!.code).not.toContain('bakeIcon(');
  });

  it('leaves dynamic values and unrelated components alone', () => {
    const out = transform(
      `import { Icon } from '@nyawave/baked-icons';
import { Icon as Other } from 'other-lib';
export const A = ({ name }: { name: string }) => <><Icon icon={name} /><Other icon="mdi:home" /></>;`,
      '/app/A.tsx',
      opts,
    );
    expect(out).toBeNull();
  });

  it('skips files that do not import from a known source', () => {
    expect(transform(`export const x = <Icon icon="mdi:home" />;`, '/app/A.tsx', opts)).toBeNull();
  });

  it('throws a helpful error for missing icons / icon sets', () => {
    expect(() =>
      transform(`import { Icon } from '@nyawave/baked-icons'; const a = <Icon icon="mdi:definitely-not-an-icon" />;`, '/a.tsx', opts),
    ).toThrow(/does not exist in icon set "mdi"/);
    expect(() =>
      transform(`import { Icon } from '@nyawave/baked-icons'; const a = <Icon icon="nope:x" />;`, '/a.tsx', opts),
    ).toThrow(/@iconify-json\/nope/);
  });

  it('can warn instead of failing', () => {
    const out = transform(
      `import { Icon } from '@nyawave/baked-icons'; const a = <><Icon icon="nope:x" /><Icon icon="mdi:home" /></>;`,
      '/a.tsx',
      { ...opts, onMissing: 'ignore' },
    );
    expect(out!.code).toContain('icon="nope:x"');
    expect(out!.code).toContain('icon={$bi_mdi$home}');
  });

  it('supports custom sources and custom icon sets', () => {
    const t = createTransformer({
      root,
      sources: ['@/ui/icon'],
      iconSets: {
        my: { prefix: 'my', icons: { star: { body: '<path d="M0 0h10v10z"/>', width: 10, height: 10 } } },
      },
    });
    const out = t.transform(
      `import { Icon } from '@/ui/icon'; export const A = () => <Icon icon="my:star" />;`,
      '/a.tsx',
    );
    expect(out!.code).toContain('"width":10,"height":10');
  });

  it('gives distinct identifiers to names that only differ in where the colon is', () => {
    // like material-symbols:light-mode vs material-symbols-light:mode
    const out = transform(
      `import { Icon } from '@nyawave/baked-icons';
export const A = () => <><Icon icon="a:b-c" /><Icon icon="a-b:c" /></>;`,
      '/a.tsx',
      {
        root,
        iconSets: {
          a: { prefix: 'a', icons: { 'b-c': { body: '<i/>' } } },
          'a-b': { prefix: 'a-b', icons: { c: { body: '<j/>' } } },
        },
      },
    );
    expect(out!.code).toContain('const $bi_a$b_c = {"body":"<i/>"');
    expect(out!.code).toContain('const $bi_a_b$c = {"body":"<j/>"');
  });

  it('avoids identifiers that already exist in the module', () => {
    const out = transform(
      `import { bakeIcon } from '@nyawave/baked-icons';
const $bi_mdi$home = 1;
export const home = bakeIcon("mdi:home");`,
      '/a.ts',
      opts,
    );
    expect(out!.code).toContain('const $bi_mdi$home$2 = {');
    expect(out!.code).toContain('export const home = $bi_mdi$home$2;');
  });

  it('declares baked data before any code, even when imports come later', () => {
    const out = transform(
      `#!/usr/bin/env node
"use client";
import { bakeIcon } from '@nyawave/baked-icons';
export const early = bakeIcon("mdi:home");
import { x } from './x';`,
      '/a.ts',
      opts,
    );
    const code = out!.code;
    expect(code.startsWith('#!/usr/bin/env node\n"use client";\nimport')).toBe(true);
    expect(code.indexOf('const $bi_mdi$home')).toBeLessThan(code.indexOf('export const early'));
  });

  it('bakes helper arguments wrapped in TS assertions or parentheses', () => {
    const out = transform(
      `import { bakeIcon, bakeIcons } from '@nyawave/baked-icons';
export const all = bakeIcons(["mdi:home", \`mdi:menu\`] as const);
export const one = bakeIcon(("mdi:home") satisfies string);`,
      '/a.ts',
      opts,
    );
    expect(out!.code).toContain('export const all = {"mdi:home":$bi_mdi$home,"mdi:menu":$bi_mdi$menu};');
    expect(out!.code).toContain('export const one = $bi_mdi$home;');
  });

  it('leaves a partially dynamic bakeIcons() call untouched', () => {
    expect(
      transform(`import { bakeIcons } from '@nyawave/baked-icons'; export const a = bakeIcons(["mdi:home", name]);`, '/a.ts', opts),
    ).toBeNull();
  });

  it('reports the line and column of a missing icon', () => {
    expect(() =>
      transform(`import { Icon } from '@nyawave/baked-icons';\nconst a = <Icon icon="mdi:nope-nope" />;`, '/a.tsx', opts),
    ).toThrow(/at \/a\.tsx:2:22/);
  });

  it('produces a source map that points unchanged code back to its origin', () => {
    const out = transform(
      `import { Icon } from '@nyawave/baked-icons';\nexport const A = () => <Icon icon="mdi:home" />;`,
      'C:\\app\\A.tsx',
      opts,
    );
    expect(out!.map.sources).toEqual(['C:/app/A.tsx']);
    expect(JSON.parse(out!.map.toString()).version).toBe(3);
    const lines = decodeMappings(out!.map.mappings);
    expect(lines).toHaveLength(5);
    expect(lines[0]![0]).toEqual([0, 0, 0, 0]);
    expect(lines[1]!.length + lines[2]!.length + lines[3]!.length).toBe(0);
    expect(lines[4]![0]).toEqual([0, 0, 1, 0]);
    const generated = out!.code.split('\n')[4]!;
    const original = 'export const A = () => <Icon icon="mdi:home" />;';
    const segment = lines[4]!.find(([col]) => col === generated.indexOf('{$bi'))!;
    expect(segment[3]).toBe(original.indexOf('"mdi:home"'));
  });

  it('reports icon set files as dependencies and re-reads them when they change', () => {
    const dir = mkdtempSync(join(tmpdir(), 'baked-icons-'));
    try {
      const file = join(dir, 'set.json');
      const write = (body: string, time: number) => {
        writeFileSync(file, JSON.stringify({ prefix: 'my', icons: { star: { body } } }));
        utimesSync(file, time, time);
      };
      write('<old/>', 1000);
      const t = createTransformer({ root: dir, iconSets: { my: './set.json' } });
      const code = `import { bakeIcon } from '@nyawave/baked-icons'; export const s = bakeIcon("my:star");`;
      const first = t.transform(code, '/a.ts')!;
      expect(first.dependencies).toEqual([file]);
      expect(first.code).toContain('<old/>');

      write('<new/>', 2000);
      expect(t.transform(code, '/a.ts')!.code).toContain('<old/>'); // cached until invalidated
      expect(t.invalidate()).toBe(true);
      expect(t.transform(code, '/a.ts')!.code).toContain('<new/>');
      expect(t.invalidate()).toBe(false);
      expect(t.invalidate(file)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// → [genCol, source, line, col] per segment, per line
function decodeMappings(mappings: string): number[][][] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const state = [0, 0, 0, 0];
  return mappings.split(';').map((line) => {
    state[0] = 0;
    return line
      ? line.split(',').map((segment) => {
          let field = 0;
          let value = 0;
          let shift = 0;
          for (const ch of segment) {
            const digit = chars.indexOf(ch);
            value += (digit & 31) << shift;
            shift += 5;
            if (digit & 32) continue;
            state[field++]! += value & 1 ? -(value >> 1) : value >> 1;
            value = shift = 0;
          }
          return [...state];
        })
      : [];
  });
}
