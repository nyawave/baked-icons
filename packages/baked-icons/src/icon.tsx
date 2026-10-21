import { type CSSProperties, type Ref, type SVGProps, useId, type JSX } from 'react';
import { buildSVG, type BuiltSVG, type Customisations, parseFlip, parseRotate, resolveIcon } from './core.ts';
import type { IconifyJSON } from './iconify.ts';
import { applyIDs, type IdPlan, planIDs } from './replace-ids.ts';
import type { BakedIcon } from './types.ts';

// ---------------------------------------------------------------------------
// Registry — for icons that are resolved from a string at runtime
// (e.g. `icon={item.icon}` where the value comes from data).
// Populate it with `addIcons(bakeIcons([...]))` or `addCollection(json)`.
// ---------------------------------------------------------------------------

const registry = new Map<string, BakedIcon>();
const collections = new Map<string, IconifyJSON[]>();
// collection lookups incl. misses, cleared by addCollection()
const resolved = new Map<string, BakedIcon | null>();
const warned = new Set<string>();

/** Register a single icon under `prefix:name`. */
export function addIcon(name: string, data: BakedIcon): void {
  registry.set(name, data);
}

/** Register several icons at once — pairs nicely with `bakeIcons([...])`. */
export function addIcons(icons: Record<string, BakedIcon>): void {
  for (const name in icons) registry.set(name, icons[name]!);
}

/** Register a whole (or partial) IconifyJSON collection. Later ones win. */
export function addCollection(collection: IconifyJSON): void {
  const list = collections.get(collection.prefix);
  if (list) list.push(collection);
  else collections.set(collection.prefix, [collection]);
  resolved.clear();
}

/** Look an icon up by `prefix:name`. Returns `null` when unknown. */
export function getIcon(name: string): BakedIcon | null {
  const direct = registry.get(name);
  if (direct) return direct;
  let icon = resolved.get(name);
  if (icon === undefined) {
    icon = null;
    const colon = name.indexOf(':');
    const list = colon > 0 ? collections.get(name.slice(0, colon)) : undefined;
    for (let i = list ? list.length : 0; i-- > 0 && !icon; ) {
      const data = resolveIcon(list![i]!, name.slice(colon + 1));
      if (data) icon = { ...data, name };
    }
    resolved.set(name, icon);
  }
  return icon;
}

// ---------------------------------------------------------------------------
// Build-time helpers. The bundler transform replaces these calls with inlined
// data, so at runtime they only ever run for icons the transform could not see
// (dynamic strings, or a missing plugin) and fall back to the registry.
// ---------------------------------------------------------------------------

/** `bakeIcon("mdi:home")` → icon data, inlined at build time. */
export function bakeIcon(name: string): BakedIcon {
  const icon = getIcon(name);
  if (!icon) {
    warnOnce(name);
    return { body: '', name };
  }
  return icon;
}

/** `bakeIcons(["mdi:home", "mdi:menu"])` → `{ "mdi:home": {...}, "mdi:menu": {...} }`, inlined at build time. */
export function bakeIcons<const T extends readonly string[]>(names: T): Record<T[number], BakedIcon> {
  const out = {} as Record<T[number], BakedIcon>;
  for (const name of names) out[name as T[number]] = bakeIcon(name);
  return out;
}

function warnOnce(name: string): void {
  if (warned.has(name)) return;
  warned.add(name);
  if (typeof console !== 'undefined') {
    console.warn(
      `[baked-icons] Icon "${name}" was not baked at build time and is not in the runtime registry. ` +
        `Make sure the baked-icons Vite plugin / Next.js wrapper is configured, ` +
        `use a string literal, or register the icon with addIcons()/addCollection().`,
    );
  }
}

// ---------------------------------------------------------------------------
// <Icon /> — API-compatible with @iconify/react for the common props.
// ---------------------------------------------------------------------------

export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'rotate' | 'ref' | 'color'> {
  /** Baked icon data, or a `prefix:name` string (baked by the bundler transform). */
  icon: BakedIcon | string;
  /** Width — number (px) or any CSS unit string, e.g. `"1.5em"`. Defaults to auto/1em. */
  width?: string | number;
  /** Height — number (px) or any CSS unit string. Defaults to `1em`. */
  height?: string | number;
  /** Rotation: `1|2|3` (quarter turns), `"90deg"`, `"25%"` … */
  rotate?: number | string;
  /** `"horizontal"`, `"vertical"` or `"horizontal,vertical"`. */
  flip?: string;
  hFlip?: boolean;
  vFlip?: boolean;
  /** Sets CSS `color`; icons use `currentColor`. */
  color?: string;
  /** Adds `vertical-align: -0.125em` so the icon sits on the text baseline. */
  inline?: boolean;
  /** Accessible title. Without it the SVG is `aria-hidden`. */
  title?: string;
  ref?: Ref<SVGSVGElement>;
}

export function Icon(props: IconProps): JSX.Element | null {
  return renderIcon(props, false);
}

/** Same as `<Icon />` but `inline` defaults to `true`. */
export function InlineIcon(props: IconProps): JSX.Element | null {
  return renderIcon(props, true);
}

interface Prepared extends BuiltSVG {
  ids: IdPlan | null;
}

// per icon object; capped so animated sizes can't grow it unbounded
const renderCache = new WeakMap<object, Map<string, Prepared>>();

function prepare(data: BakedIcon, custom: Customisations): Prepared {
  const key = `${custom.width}|${custom.height}|${custom.rotate}|${custom.hFlip}|${custom.vFlip}`;
  let byKey = renderCache.get(data);
  let out = byKey?.get(key);
  if (!out) {
    const svg = buildSVG(data, custom);
    out = { attributes: svg.attributes, body: svg.body, ids: planIDs(svg.body) };
    if (!byKey) renderCache.set(data, (byKey = new Map()));
    else if (byKey.size >= 16) byKey.clear();
    byKey.set(key, out);
  }
  return out;
}

function renderIcon(props: IconProps, inlineDefault: boolean): JSX.Element | null {
  const {
    icon,
    width,
    height,
    rotate,
    flip,
    hFlip,
    vFlip,
    color,
    inline = inlineDefault,
    title,
    style,
    className,
    ref,
    ...rest
  } = props;

  // Stable per-instance prefix so that <defs> ids never collide between icons,
  // identical on server and client.
  const uid = useId();

  const data = typeof icon === 'string' ? getIcon(icon) : icon;
  if (!data || !data.body) {
    if (typeof icon === 'string') warnOnce(icon);
    return null;
  }

  const custom: Customisations = { width, height, hFlip, vFlip };
  if (flip) parseFlip(flip, custom);
  if (rotate !== undefined) custom.rotate = typeof rotate === 'number' ? rotate : parseRotate(rotate);

  const svg = prepare(data, custom);
  let body = svg.ids ? applyIDs(svg.body, svg.ids, `bi${uid.replace(/[^a-zA-Z0-9_-]/g, '')}-`) : svg.body;
  if (title) body = `<title>${escapeText(title)}</title>${body}`;

  const mergedStyle: CSSProperties | undefined =
    color !== undefined || inline
      ? { ...(color !== undefined ? { color } : {}), ...(inline ? { verticalAlign: '-0.125em' } : {}), ...style }
      : style;

  let classes = 'iconify';
  if (data.name) {
    const colon = data.name.indexOf(':');
    classes += ` iconify--${colon > 0 ? data.name.slice(0, colon) : data.name}`;
  }
  if (className) classes += ` ${className}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      role="img"
      aria-hidden={title ? undefined : true}
      {...rest}
      {...svg.attributes}
      ref={ref}
      className={classes}
      style={mergedStyle}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
