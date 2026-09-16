import type { IconifyJSON } from '@iconify/types';
import {
  defaultIconProps,
  flipFromString,
  getIconData,
  iconToSVG,
  rotateFromString,
  type IconifyIconCustomisations,
} from '@iconify/utils';
import { type CSSProperties, type Ref, type SVGProps, useId, type JSX } from 'react';
import { replaceIDs } from './replace-ids.ts';
import type { BakedIcon } from './types.ts';

// ---------------------------------------------------------------------------
// Registry — for icons that are resolved from a string at runtime
// (e.g. `icon={item.icon}` where the value comes from data).
// Populate it with `addIcons(bakeIcons([...]))` or `addCollection(json)`.
// ---------------------------------------------------------------------------

const registry = new Map<string, BakedIcon>();
const collections = new Map<string, IconifyJSON>();
const warned = new Set<string>();

/** Register a single icon under `prefix:name`. */
export function addIcon(name: string, data: BakedIcon): void {
  registry.set(name, data);
}

/** Register several icons at once — pairs nicely with `bakeIcons([...])`. */
export function addIcons(icons: Record<string, BakedIcon>): void {
  for (const name in icons) registry.set(name, icons[name]!);
}

/** Register a whole (or partial) IconifyJSON collection. */
export function addCollection(collection: IconifyJSON): void {
  collections.set(collection.prefix, collection);
}

/** Look an icon up by `prefix:name`. Returns `null` when unknown. */
export function getIcon(name: string): BakedIcon | null {
  const direct = registry.get(name);
  if (direct) return direct;
  const colon = name.indexOf(':');
  if (colon > 0) {
    const set = collections.get(name.slice(0, colon));
    if (set) {
      const data = getIconData(set, name.slice(colon + 1));
      if (data) {
        const baked: BakedIcon = { ...data, name };
        registry.set(name, baked);
        return baked;
      }
    }
  }
  return null;
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

  const customisations: IconifyIconCustomisations = {};
  if (width !== undefined) customisations.width = width;
  if (height !== undefined) customisations.height = height;
  if (hFlip) customisations.hFlip = true;
  if (vFlip) customisations.vFlip = true;
  if (flip) flipFromString(customisations, flip);
  if (rotate !== undefined) {
    customisations.rotate = typeof rotate === 'number' ? rotate : rotateFromString(rotate);
  }

  const svg = iconToSVG({ ...defaultIconProps, ...data }, customisations);
  let body = replaceIDs(svg.body, `bi${uid.replace(/[^a-zA-Z0-9_-]/g, '')}-`);
  if (title) body = `<title>${escapeText(title)}</title>${body}`;

  const mergedStyle: CSSProperties | undefined =
    color !== undefined || inline
      ? { ...(color !== undefined ? { color } : {}), ...(inline ? { verticalAlign: '-0.125em' } : {}), ...style }
      : style;

  const classes = ['iconify'];
  if (data.name) {
    const colon = data.name.indexOf(':');
    classes.push(`iconify--${colon > 0 ? data.name.slice(0, colon) : data.name}`);
  }
  if (className) classes.push(className);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      role="img"
      aria-hidden={title ? undefined : true}
      {...rest}
      {...svg.attributes}
      ref={ref}
      className={classes.join(' ')}
      style={mergedStyle}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
