// Output must stay byte-identical to @iconify/utils (test/parity.test.ts).
import type { IconifyIcon, IconifyJSON, IconifyOptional } from './iconify.ts';

type Size = string | number;

export interface Customisations {
  width?: Size | null | undefined;
  height?: Size | null | undefined;
  rotate?: number | undefined;
  hFlip?: boolean | undefined;
  vFlip?: boolean | undefined;
}

export interface BuiltSVG {
  attributes: { width?: string; height?: string; viewBox: string };
  body: string;
}

type Resolved = IconifyIcon & { hidden?: boolean };

const DIMENSIONS = ['left', 'top', 'width', 'height'] as const;

export function resolveIcon(set: IconifyJSON, name: string): Resolved | null {
  const { icons, aliases } = set;
  let item: (IconifyOptional & { body?: string; parent?: string; hidden?: boolean }) | undefined;
  let out: Partial<Resolved> = {};
  let rotate = 0;
  let hFlip = false;
  let vFlip = false;
  for (let depth = 0, current: string | undefined = name; current !== undefined; depth++) {
    item = Object.hasOwn(icons, current) ? icons[current] : aliases && Object.hasOwn(aliases, current) ? aliases[current] : undefined;
    if (!item || depth > 64) return null; // depth cap = cycle guard
    // nearest link wins for dimensions, transforms accumulate
    for (const key of DIMENSIONS) if (out[key] === undefined && item[key] !== undefined) out[key] = item[key];
    if (out.hidden === undefined && item.hidden !== undefined) out.hidden = item.hidden;
    rotate += item.rotate || 0;
    if (item.hFlip) hFlip = !hFlip;
    if (item.vFlip) vFlip = !vFlip;
    if (item.body !== undefined) break;
    current = item.parent;
  }
  if (!item || item.body === undefined) return null;
  out.body = item.body;
  for (const key of DIMENSIONS) if (out[key] === undefined && set[key] !== undefined) out[key] = set[key];
  if ((rotate %= 4)) out.rotate = rotate;
  if (hFlip) out.hFlip = true;
  if (vFlip) out.vFlip = true;
  return out as Resolved;
}

export function buildSVG(icon: IconifyIcon, custom: Customisations = {}): BuiltSVG {
  let left = icon.left ?? 0;
  let top = icon.top ?? 0;
  let w = icon.width ?? 16;
  let h = icon.height ?? 16;
  let body = icon.body;

  for (let pass = 0; pass < 2; pass++) {
    const t: Customisations = pass ? custom : icon;
    let rot = t.rotate || 0;
    let ops = '';
    if (t.hFlip && t.vFlip) {
      rot += 2;
    } else if (t.hFlip) {
      ops = ` translate(${w + left} ${-top}) scale(-1 1)`;
      left = top = 0;
    } else if (t.vFlip) {
      ops = ` translate(${-left} ${h + top}) scale(1 -1)`;
      left = top = 0;
    }
    rot = ((rot % 4) + 4) % 4;
    if (rot === 1) ops = ` rotate(90 ${h / 2 + top} ${h / 2 + top})` + ops;
    else if (rot === 2) ops = ` rotate(180 ${w / 2 + left} ${h / 2 + top})` + ops;
    else if (rot === 3) ops = ` rotate(-90 ${w / 2 + left} ${w / 2 + left})` + ops;
    if (rot === 1 || rot === 3) [left, top, w, h] = [top, left, h, w];
    if (ops) body = wrap(body, `<g transform="${ops.slice(1)}">`);
  }

  const cw = custom.width ?? null;
  const ch = custom.height ?? null;
  let width: Size;
  let height: Size;
  if (cw === null) {
    height = ch === null ? '1em' : ch === 'auto' ? h : ch;
    width = scale(height, w / h);
  } else {
    width = cw === 'auto' ? w : cw;
    height = ch === null ? scale(width, h / w) : ch === 'auto' ? h : ch;
  }

  // key order affects SSR markup
  const attributes = {} as BuiltSVG['attributes'];
  if (!isUnset(width)) attributes.width = String(width);
  if (!isUnset(height)) attributes.height = String(height);
  attributes.viewBox = `${left} ${top} ${w} ${h}`;
  return { attributes, body };
}

export function parseFlip(value: string, into: Customisations): void {
  for (const part of value.split(/[\s,]+/)) {
    if (part === 'horizontal') into.hFlip = true;
    else if (part === 'vertical') into.vFlip = true;
  }
}

/** `"1"` | `"90deg"` | `"25%"` → quarter turns */
export function parseRotate(value: string): number {
  const unit = value.replace(/^-?[0-9.]*/, '');
  let turns: number;
  if (!unit) turns = parseInt(value);
  else if (unit === value || (unit !== 'deg' && unit !== '%')) return 0;
  else {
    turns = parseFloat(value.slice(0, -unit.length)) / (unit === 'deg' ? 90 : 25);
    if (turns % 1) return 0;
  }
  return turns ? ((turns % 4) + 4) % 4 : 0;
}

function isUnset(value: Size): boolean {
  return value === 'unset' || value === 'undefined' || value === 'none';
}

function scale(size: Size, ratio: number): Size {
  if (ratio === 1) return size;
  if (typeof size === 'number') return Math.ceil(size * ratio * 100) / 100;
  return size.replace(/-?[0-9.]*[0-9]+[0-9.]*/g, (n) => String(Math.ceil(parseFloat(n) * ratio * 100) / 100));
}

// <defs> are hoisted out of the transformed group
function wrap(body: string, open: string): string {
  let defs = '';
  for (let i = body.indexOf('<defs'); i >= 0; ) {
    const gt = body.indexOf('>', i);
    if (gt < 0) break;
    const head = body.slice(0, i).trim();
    if (body.charCodeAt(gt - 1) === 47 /* "/" */) {
      body = head + body.slice(gt + 1);
    } else {
      const close = body.indexOf('</defs', gt);
      const end = close < 0 ? -1 : body.indexOf('>', close);
      if (end < 0) break;
      defs += body.slice(gt + 1, close).trim();
      body = head + body.slice(end + 1);
    }
    i = body.indexOf('<defs', head.length);
  }
  return (defs ? `<defs>${defs}</defs>` : '') + open + body + '</g>';
}
