import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, join, resolve } from 'node:path';
import { resolveIcon } from './core.ts';
import type { IconifyIcon, IconifyJSON } from './iconify.ts';
import type { BakedIcon, ResolvedBakeOptions } from './types.ts';

/** `prefix:name` — the only format that is baked at build time. */
const ICON_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;
// only these may be spliced into `@iconify-json/<prefix>`
const PREFIX_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isIconName(value: string): boolean {
  return ICON_NAME_RE.test(value);
}

/** Same rules as Iconify's `stringToIcon(value, true, false)`; provider is ignored. */
export function parseIconName(value: string): { prefix: string; name: string } | null {
  const parts = value.split(':');
  if (value[0] === '@') {
    if (parts.length < 2 || parts.length > 3) return null;
    parts.shift();
  }
  if (parts.length > 3) return null;
  let prefix: string | undefined;
  let name: string | undefined;
  if (parts.length > 1) {
    name = parts.pop();
    prefix = parts.pop();
  } else {
    const dash = parts[0]!.indexOf('-');
    if (dash < 0) return null;
    prefix = parts[0]!.slice(0, dash);
    name = parts[0]!.slice(dash + 1);
  }
  return prefix && name ? { prefix, name } : null;
}

export class IconResolver {
  private readonly sets = new Map<string, IconifyJSON | null>();
  private readonly icons = new Map<string, BakedIcon | null>();
  private readonly files = new Map<string, { file: string; mtime: number }>();
  private readonly require: NodeJS.Require;

  constructor(private readonly options: ResolvedBakeOptions) {
    this.require = createRequire(join(resolve(options.root), 'package.json'));
  }

  /** Resolve `prefix:name` to baked icon data, or `null` when not found. */
  resolve(name: string): BakedIcon | null {
    const cached = this.icons.get(name);
    if (cached !== undefined) return cached;

    const parsed = parseIconName(name);
    let result: BakedIcon | null = null;
    if (parsed) {
      const set = this.loadSet(parsed.prefix);
      const data = set ? resolveIcon(set, parsed.name) : null;
      if (data) result = compact(data, this.options.keepName ? `${parsed.prefix}:${parsed.name}` : undefined);
    }
    this.icons.set(name, result);
    return result;
  }

  loadSet(prefix: string): IconifyJSON | null {
    const cached = this.sets.get(prefix);
    if (cached !== undefined) return cached;

    let set: IconifyJSON | null = null;
    const sets = this.options.iconSets;
    const custom = Object.hasOwn(sets, prefix) ? sets[prefix] : undefined;
    if (custom && typeof custom === 'object') {
      set = custom;
    } else if (typeof custom === 'string') {
      set = this.readJSON(prefix, isAbsolute(custom) ? custom : resolve(this.options.root, custom));
    } else if (PREFIX_RE.test(prefix)) {
      set =
        this.tryResolve(prefix, `@iconify-json/${prefix}/icons.json`) ??
        this.tryResolve(prefix, `@iconify/json/json/${prefix}.json`);
    }

    if (set && !isIconSet(set)) {
      throw new Error(`[baked-icons] Icon set "${prefix}" is not a valid IconifyJSON object.`);
    }
    this.sets.set(prefix, set);
    return set;
  }

  fileOf(prefix: string): string | undefined {
    return this.files.get(prefix)?.file;
  }

  /** Drops sets read from `file`; without it, sets whose file mtime changed. */
  invalidate(file?: string): boolean {
    let dropped = false;
    for (const [prefix, entry] of this.files) {
      if (file !== undefined ? entry.file !== file : mtimeOf(entry.file) === entry.mtime) continue;
      this.files.delete(prefix);
      this.sets.delete(prefix);
      dropped = true;
    }
    if (dropped) this.icons.clear();
    return dropped;
  }

  /** Human readable hint for the "missing" error. */
  hint(name: string): string {
    const parsed = parseIconName(name);
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

  private tryResolve(prefix: string, spec: string): IconifyJSON | null {
    let file: string;
    try {
      file = this.require.resolve(spec);
    } catch {
      return null;
    }
    return this.readJSON(prefix, file);
  }

  private readJSON(prefix: string, file: string): IconifyJSON {
    try {
      const mtime = mtimeOf(file);
      const set = JSON.parse(readFileSync(file, 'utf8')) as IconifyJSON;
      this.files.set(prefix, { file, mtime });
      return set;
    } catch (error) {
      throw new Error(`[baked-icons] Could not read icon set from "${file}": ${(error as Error).message}`);
    }
  }
}

function mtimeOf(file: string): number {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return -1;
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

const NUMBER_PROPS = ['left', 'top', 'width', 'height', 'rotate'] as const;
const BOOLEAN_PROPS = ['hFlip', 'vFlip', 'hidden'] as const;

function isEntry(item: unknown, needBody: boolean): boolean {
  if (!item || typeof item !== 'object') return false;
  const entry = item as Record<string, unknown>;
  if (needBody ? typeof entry.body !== 'string' : entry.body !== undefined && typeof entry.body !== 'string') return false;
  for (const key of NUMBER_PROPS) if (entry[key] !== undefined && typeof entry[key] !== 'number') return false;
  for (const key of BOOLEAN_PROPS) if (entry[key] !== undefined && typeof entry[key] !== 'boolean') return false;
  return true;
}

/** Same rules as Iconify's `quicklyValidateIconSet`. */
export function isIconSet(value: unknown): value is IconifyJSON {
  if (!value || typeof value !== 'object') return false;
  const set = value as Record<string, unknown>;
  const { icons, aliases } = set as { icons?: Record<string, unknown>; aliases?: Record<string, unknown> };
  if (typeof set.prefix !== 'string' || !icons || typeof icons !== 'object') return false;
  if (set.provider !== undefined && typeof set.provider !== 'string') return false;
  if (aliases !== undefined && (!aliases || typeof aliases !== 'object')) return false;
  if (set.not_found !== undefined && (!set.not_found || typeof set.not_found !== 'object')) return false;
  for (const key of NUMBER_PROPS) if (key !== 'rotate' && set[key] !== undefined && typeof set[key] !== 'number') return false;
  for (const name in icons) if (!name || !isEntry(icons[name], true)) return false;
  for (const name in aliases) {
    const alias = aliases[name] as { parent?: unknown };
    if (!name || !isEntry(alias, false) || typeof alias.parent !== 'string') return false;
    if (!Object.hasOwn(icons, alias.parent) && !Object.hasOwn(aliases!, alias.parent)) return false;
  }
  return true;
}
