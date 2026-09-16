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
    expect(out!.code).toContain('const $bi_mdi_home = {"body":"<path');
    expect(out!.code).toContain('icon={$bi_mdi_home}');
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
    expect(out!.code.match(/\$bi_mdi_home/g)!.length).toBe(3); // 1 decl + 2 uses
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
    expect(out!.code).toContain('icon={open ? $bi_mdi_menu_open : $bi_mdi_menu}');
  });

  it('bakes bakeIcon() and bakeIcons() calls in plain .ts files', () => {
    const out = transform(
      `import { bakeIcon, bakeIcons } from '@nyawave/baked-icons';
export const home = bakeIcon("mdi:home");
export const all = bakeIcons(["mdi:home", "lucide:house"]);`,
      '/app/icons.ts',
      opts,
    );
    expect(out!.code).toContain('export const home = $bi_mdi_home;');
    expect(out!.code).toContain('export const all = {"mdi:home":$bi_mdi_home,"lucide:house":$bi_lucide_house};');
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
    expect(out!.code).toContain('icon={$bi_mdi_home}');
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
});
