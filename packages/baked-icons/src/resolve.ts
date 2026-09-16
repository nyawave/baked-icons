import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, join, resolve } from 'node:path';
import type { IconifyIcon, IconifyJSON } from '@iconify/types';
import { getIconData, quicklyValidateIconSet, stringToIcon } from '@iconify/utils';
import type { BakedIcon, ResolvedBakeOptions } from './types.ts';

/** `prefix:name` — the only format that is baked at build time. */
const ICON_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isIconName(value: string): boolean {
  return ICON_NAME_RE.test(value);
}

export class IconResolver {
  private readonly sets = new Map<string, IconifyJSON | null>();
  private readonly icons = new Map<string, BakedIcon | null>();
  private readonly require: NodeJS.Require;

  constructor(private readonly options: ResolvedBakeOptions) {
    this.require = createRequire(join(resolve(options.root), 'package.json'));
  }

  /** Resolve `prefix:name` to baked icon data, or `null` when not found. */
  resolve(name: string): BakedIcon | null {
    const cached = this.icons.get(name);
    if (cached !== undefined) return cached;

    const parsed = stringToIcon(name, true, false);
    let result: BakedIcon | null = null;
    if (parsed) {
      const set = this.loadSet(parsed.prefix);
      const data = set ? getIconData(set, parsed.name) : null;
      if (data) result = compact(data, this.options.keepName ? `${parsed.prefix}:${parsed.name}` : undefined);
    }
    this.icons.set(name, result);
    return result;
  }

  loadSet(prefix: string): IconifyJSON | null {
    const cached = this.sets.get(prefix);
    if (cached !== undefined) return cached;

    let set: IconifyJSON | null = null;
    const custom = this.options.iconSets[prefix];
    if (custom && typeof custom === 'object') {
      set = custom;
    } else if (typeof custom === 'string') {
      set = this.readJSON(isAbsolute(custom) ? custom : resolve(this.options.root, custom));
    } else {
      set =
        this.tryResolve(`@iconify-json/${prefix}/icons.json`) ??
        this.tryResolve(`@iconify/json/json/${prefix}.json`);
    }

    if (set && !quicklyValidateIconSet(set)) {
      throw new Error(`[baked-icons] Icon set "${prefix}" is not a valid IconifyJSON object.`);
    }
    this.sets.set(prefix, set);
    return set;
  }

  /** Human readable hint for the "missing" error. */
  hint(name: string): string {
    const parsed = stringToIcon(name, true, false);
    if (!parsed) return `"${name}" is not a valid icon name (expected "prefix:name").`;
    if (!this.loadSet(parsed.prefix)) {
      return (
        `Icon set "${parsed.prefix}" not found. Install it with ` +
        `"pnpm add -D @iconify-json/${parsed.prefix}" (or "@iconify/json" for all sets), ` +
        `or pass it via the "iconSets" option.`
      );
    }
    return `Icon "${parsed.name}" does not exist in icon set "${parsed.prefix}".`;
  }

  private tryResolve(spec: string): IconifyJSON | null {
    let file: string;
    try {
      file = this.require.resolve(spec);
    } catch {
      return null;
    }
    return this.readJSON(file);
  }

  private readJSON(file: string): IconifyJSON {
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as IconifyJSON;
    } catch (error) {
      throw new Error(`[baked-icons] Could not read icon set from "${file}": ${(error as Error).message}`);
    }
  }
}

/** Drop default values so that baked JSON is as small as possible. */
function compact(icon: IconifyIcon, name: string | undefined): BakedIcon {
  const out: BakedIcon = { body: icon.body };
  if (name) out.name = name;
  if (icon.width !== undefined && icon.width !== 16) out.width = icon.width;
  if (icon.height !== undefined && icon.height !== 16) out.height = icon.height;
  if (icon.left) out.left = icon.left;
  if (icon.top) out.top = icon.top;
  if (icon.rotate) out.rotate = icon.rotate;
  if (icon.hFlip) out.hFlip = true;
  if (icon.vFlip) out.vFlip = true;
  return out;
}
