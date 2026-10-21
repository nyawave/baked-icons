import { createRequire } from 'node:module';
import {
  defaultIconProps,
  flipFromString,
  getIconData,
  iconToSVG,
  quicklyValidateIconSet,
  rotateFromString,
  stringToIcon,
  type IconifyIconCustomisations,
} from '@iconify/utils';
import { describe, expect, it } from 'vitest';
import { buildSVG, type Customisations, parseFlip, parseRotate, resolveIcon } from '../src/core.ts';
import type { IconifyIcon, IconifyJSON } from '../src/iconify.ts';
import { replaceIDs } from '../src/replace-ids.ts';
import { isIconSet, parseIconName } from '../src/resolve.ts';

const require = createRequire(import.meta.url);
const sets: IconifyJSON[] = [require('@iconify-json/mdi/icons.json'), require('@iconify-json/lucide/icons.json')];

// Iconify sometimes writes explicit defaults (`rotate: 0`)
function normalize(icon: object | null): object | null {
  if (!icon) return icon;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(icon)) if (value !== 0 && value !== false) out[key] = value;
  return out;
}

const customisations: Customisations[] = [
  {},
  { width: 24 },
  { height: 32 },
  { width: '2em' },
  { height: '1.5rem' },
  { width: 'auto' },
  { height: 'auto' },
  { width: 'auto', height: 'auto' },
  { width: 'unset' },
  { width: 10, height: 'none' },
  { width: 'calc(1em + 2px)' },
  { rotate: 1 },
  { rotate: 2, hFlip: true },
  { rotate: 3, vFlip: true },
  { rotate: -1, width: 20 },
  { hFlip: true, vFlip: true },
  { hFlip: true, vFlip: true, rotate: 1 },
];

function reference(icon: IconifyIcon, custom: Customisations) {
  const full: IconifyIconCustomisations = {};
  for (const [key, value] of Object.entries(custom)) if (value !== undefined) (full as Record<string, unknown>)[key] = value;
  const svg = iconToSVG({ ...defaultIconProps, ...icon }, full);
  return JSON.stringify({ attributes: svg.attributes, body: svg.body });
}

function ours(icon: IconifyIcon, custom: Customisations) {
  return JSON.stringify(buildSVG(icon, custom));
}

const synthetic: IconifyIcon[] = [
  { body: '<path d="M0 0"/>' },
  { body: '<path d="M0 0"/>', width: 24, height: 16, left: 2, top: -3 },
  { body: '<path d="M0 0"/>', width: 10, height: 30, rotate: 1, hFlip: true },
  { body: '<path d="M0 0"/>', width: 7, height: 3, rotate: 3, vFlip: true },
  { body: '<path d="M0 0"/>', hFlip: true, vFlip: true },
  { body: ' <defs> <linearGradient id="a"/> </defs> <rect fill="url(#a)"/>', width: 20, rotate: 2 },
  { body: '<g/><defs><filter id="f"/></defs><rect filter="url(#f)"/>', vFlip: true },
];

describe('parity with @iconify/utils', () => {
  it('resolves every icon and alias identically', () => {
    for (const set of sets) {
      const names = [...Object.keys(set.icons), ...Object.keys(set.aliases ?? {})];
      expect(names.length).toBeGreaterThan(100);
      for (const name of names) {
        expect(normalize(resolveIcon(set, name)), `${set.prefix}:${name}`).toEqual(normalize(getIconData(set, name)));
      }
      expect(resolveIcon(set, 'definitely-missing')).toBeNull();
    }
  });

  it('resolves alias chains, set defaults and transformations identically', () => {
    const set: IconifyJSON = {
      prefix: 'x',
      width: 24,
      height: 20,
      icons: { a: { body: '<a/>', rotate: 1 }, b: { body: '<b/>', width: 10, hFlip: true } },
      aliases: {
        a1: { parent: 'a', rotate: 2, vFlip: true },
        a2: { parent: 'a1', rotate: 3, hFlip: true, height: 5 },
        b1: { parent: 'b', hFlip: true },
        broken: { parent: 'nope' },
        loop1: { parent: 'loop2' },
        loop2: { parent: 'loop1' },
        constructor: { parent: 'toString' },
      },
    };
    for (const name of ['a', 'b', 'a1', 'a2', 'b1', 'broken', 'loop1', 'missing']) {
      expect(normalize(resolveIcon(set, name)), name).toEqual(normalize(getIconData(set as never, name)));
    }
    expect(resolveIcon(set, 'constructor')).toBeNull();
    expect(resolveIcon(set, 'toString')).toBeNull();
  });

  it('builds identical SVG for every icon × customisation', () => {
    for (const set of sets) {
      for (const name of Object.keys(set.icons)) {
        const icon = getIconData(set, name)!;
        for (const custom of customisations) expect(ours(icon, custom), `${name} ${JSON.stringify(custom)}`).toBe(reference(icon, custom));
      }
    }
    for (const icon of synthetic) {
      for (const custom of customisations) expect(ours(icon, custom), `${icon.body} ${JSON.stringify(custom)}`).toBe(reference(icon, custom));
    }
  });

  it('keeps every <defs> block out of the transform group', () => {
    const svg = buildSVG({ body: '<defs><a id="x"/></defs><b/><defs><c id="y"/></defs><d/>', hFlip: true });
    expect(svg.body).toBe('<defs><a id="x"/><c id="y"/></defs><g transform="translate(16 0) scale(-1 1)"><b/><d/></g>');
    expect(buildSVG({ body: '<defs/><b/>', vFlip: true }).body).toBe('<g transform="translate(0 16) scale(1 -1)"><b/></g>');
  });

  it('parses rotate and flip identically', () => {
    const rotations = ['', '0', '1', '2', '3', '4', '5', '-1', '-5', '1.5', '90deg', '180deg', '270deg', '-90deg', '45deg', '360deg',
      '25%', '50%', '-25%', '10%', 'abc', 'deg', '.deg', '90rad', '-', '1e2', ' 1', '0090deg'];
    for (const value of rotations) expect(parseRotate(value), value).toBe(rotateFromString(value));
    for (const value of ['horizontal', 'vertical', 'horizontal,vertical', ' vertical  horizontal ', 'x', '', 'horizontal,,']) {
      const a: Customisations = {};
      const b: IconifyIconCustomisations = {};
      parseFlip(value, a);
      flipFromString(b, value);
      expect(a, value).toEqual(b);
    }
  });

  it('parses icon names identically', () => {
    const names = ['mdi:home', 'mdi-home', 'mdi-light-home', '@p:mdi:home', 'p:mdi:home', 'a:b:c:d', '@p:x', '@p', 'home', ':home',
      'mdi:', 'mdi-', '-home', '', 'Mdi:Home!', '@:a:b'];
    for (const name of names) {
      const ref = stringToIcon(name, true, false);
      expect(parseIconName(name), name).toEqual(ref ? { prefix: ref.prefix, name: ref.name } : null);
    }
  });

  it('validates icon sets identically', () => {
    const valid = { prefix: 'x', icons: { a: { body: '' } }, aliases: { b: { parent: 'a' }, c: { parent: 'b', rotate: 1 } } };
    const cases: unknown[] = [
      ...sets,
      valid,
      null,
      'x',
      { prefix: 1, icons: {} },
      { prefix: 'x' },
      { prefix: 'x', icons: {}, width: '16' },
      { prefix: 'x', icons: {}, provider: 1 },
      { prefix: 'x', icons: { a: { body: 1 } } },
      { prefix: 'x', icons: { a: { body: '', hFlip: 'yes' } } },
      { prefix: 'x', icons: { a: { body: '', rotate: '1' } } },
      { prefix: 'x', icons: { a: { body: '' } }, aliases: { b: { parent: 'nope' } } },
      { prefix: 'x', icons: { a: { body: '' } }, aliases: { b: { parent: 1 } } },
      { prefix: 'x', icons: { '': { body: '' } } },
    ];
    for (const value of cases) expect(isIconSet(value), JSON.stringify(value)?.slice(0, 80)).toBe(!!quicklyValidateIconSet(value));
  });
});

// previous multi-pass implementation
function referenceReplaceIDs(body: string, prefix: string): string {
  const ids: string[] = [];
  const idRe = /\sid="(\S+)"/g;
  let match: RegExpExecArray | null;
  while ((match = idRe.exec(body))) ids.push(match[1]!);
  if (!ids.length) return body;
  ids.forEach((id, index) => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    body = body.replace(new RegExp(`([#;"])(${escaped})([")]|\\.[a-z])`, 'g'), `$1${prefix}${index}\u0000$3`);
  });
  return body.split('\u0000').join('');
}

describe('replaceIDs', () => {
  it('matches the multi-pass implementation', () => {
    const bodies = [
      '<path d="M0 0"/>',
      '<defs><linearGradient id="a"><stop/></linearGradient></defs><rect fill="url(#a)"/>',
      '<defs><g id="a"/><g id="ab"/><g id="a.b"/></defs><use href="#ab"/><use href="#a"/><use xlink:href="#a.b"/>',
      '<g id="a"/><g id="a"/><g id="b"/><use href="#b"/>',
      '<animate id="x" begin="0;x.end"/><animate begin="x.begin"/><path id="y(1)" fill="url(#y(1))"/>',
      '<mask id="m"/><g mask="url(#m)" class="m"/>',
    ];
    for (const body of bodies) expect(replaceIDs(body, 'p-'), body).toBe(referenceReplaceIDs(body, 'p-'));
  });
});
