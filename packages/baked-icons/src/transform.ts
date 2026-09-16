import { MagicString } from 'magic-string';
import { parseSync } from 'oxc-parser';
import { IconResolver, isIconName } from './resolve.ts';
import { type BakeOptions, type BakedIcon, type ResolvedBakeOptions, resolveOptions } from './types.ts';

export type { BakeOptions, BakedIcon } from './types.ts';
export { IconResolver, isIconName } from './resolve.ts';

export interface TransformResult {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
  /** Names of icons that were baked into this module. */
  icons: string[];
}

const SCRIPT_RE = /\.[cm]?[jt]sx?$/;

/** True for files the transform should even look at. */
export function shouldTransform(id: string): boolean {
  const clean = id.split('?')[0] ?? id;
  return SCRIPT_RE.test(clean) && !/[\\/]node_modules[\\/]/.test(clean);
}

/**
 * Create a transformer with a shared icon cache. Use one instance per build.
 */
export function createTransformer(
  options: BakeOptions = {},
): { transform: (code: string, id: string) => TransformResult | null; options: ResolvedBakeOptions } {
  const resolved = resolveOptions(options);
  const resolver = new IconResolver(resolved);
  return {
    options: resolved,
    transform: (code, id) => transformSource(code, id, resolved, resolver),
  };
}

/** One-shot transform (no cache across files). */
export function transform(code: string, id: string, options: BakeOptions = {}): TransformResult | null {
  const resolved = resolveOptions(options);
  return transformSource(code, id, resolved, new IconResolver(resolved));
}

// ---------------------------------------------------------------------------
// implementation
// ---------------------------------------------------------------------------

// Minimal structural AST types — enough for what we touch. oxc-parser emits ESTree + JSX.
interface Node {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
}

function transformSource(
  code: string,
  id: string,
  options: ResolvedBakeOptions,
  resolver: IconResolver,
): TransformResult | null {
  // Cheap pre-check: nothing to do if the file doesn't mention any known source.
  if (!options.sources.some((s) => code.includes(s))) return null;

  const filename = id.split('?')[0] ?? id;
  const lang = filename.endsWith('.tsx') ? 'tsx' : filename.endsWith('.ts') || filename.endsWith('.mts') || filename.endsWith('.cts') ? 'ts' : 'jsx';
  const parsed = parseSync(filename, code, { lang, sourceType: 'module' });
  if (parsed.errors.length) return null; // let the real compiler report syntax errors
  const program = parsed.program as unknown as Node;

  // 1. Collect local bindings imported from our sources.
  const componentNames = new Set<string>();
  const helperNames = new Set<string>();
  const namespaces = new Set<string>();
  let insertAt = 0;

  for (const stmt of program.body as Node[]) {
    if (stmt.type === 'ExpressionStatement' && typeof stmt.directive === 'string') {
      insertAt = Math.max(insertAt, stmt.end);
      continue;
    }
    if (stmt.type !== 'ImportDeclaration') continue;
    insertAt = Math.max(insertAt, stmt.end);
    const source = (stmt.source as Node).value as string;
    if (!options.sources.includes(source)) continue;
    for (const spec of stmt.specifiers as Node[]) {
      const local = (spec.local as Node).name as string;
      if (spec.type === 'ImportNamespaceSpecifier') {
        namespaces.add(local);
      } else if (spec.type === 'ImportSpecifier') {
        const imported = spec.imported as Node;
        const name = (imported.type === 'Identifier' ? imported.name : imported.value) as string;
        if (options.components.includes(name)) componentNames.add(local);
        if (options.helpers.includes(name)) helperNames.add(local);
      }
    }
  }
  if (!componentNames.size && !helperNames.size && !namespaces.size) return null;

  // 2. Walk & collect edits.
  const s = new MagicString(code);
  const baked = new Map<string, { ident: string; data: BakedIcon }>();
  let touched = false;

  const identFor = (name: string): string | null => {
    const existing = baked.get(name);
    if (existing) return existing.ident;
    const data = resolver.resolve(name);
    if (!data) {
      const message = `[baked-icons] ${resolver.hint(name)}\n  at ${filename}`;
      if (options.onMissing === 'error') throw new Error(message);
      if (options.onMissing === 'warn') console.warn(message);
      return null;
    }
    const ident = `$bi_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    baked.set(name, { ident, data });
    return ident;
  };

  /** Replace a string-literal-ish expression with a baked identifier. Returns true if replaced. */
  const bakeExpression = (node: Node): boolean => {
    switch (node.type) {
      case 'Literal': {
        if (typeof node.value !== 'string' || !isIconName(node.value)) return false;
        const ident = identFor(node.value);
        if (!ident) return false;
        s.overwrite(node.start, node.end, ident);
        return true;
      }
      case 'TemplateLiteral': {
        const exprs = node.expressions as Node[];
        const quasis = node.quasis as Node[];
        if (exprs.length || quasis.length !== 1) return false;
        const value = (quasis[0]!.value as { cooked: string | null }).cooked;
        if (!value || !isIconName(value)) return false;
        const ident = identFor(value);
        if (!ident) return false;
        s.overwrite(node.start, node.end, ident);
        return true;
      }
      case 'ConditionalExpression': {
        const a = bakeExpression(node.consequent as Node);
        const b = bakeExpression(node.alternate as Node);
        return a || b;
      }
      case 'LogicalExpression': {
        const a = bakeExpression(node.left as Node);
        const b = bakeExpression(node.right as Node);
        return a || b;
      }
      case 'TSAsExpression':
      case 'TSSatisfiesExpression':
      case 'TSNonNullExpression':
      case 'ParenthesizedExpression':
        return bakeExpression(node.expression as Node);
      case 'JSXExpressionContainer':
        return bakeExpression(node.expression as Node);
      default:
        return false;
    }
  };

  const isOurComponent = (name: Node): boolean => {
    if (name.type === 'JSXIdentifier') return componentNames.has(name.name as string);
    if (name.type === 'JSXMemberExpression') {
      const object = name.object as Node;
      const property = name.property as Node;
      return (
        object.type === 'JSXIdentifier' &&
        namespaces.has(object.name as string) &&
        options.components.includes(property.name as string)
      );
    }
    return false;
  };

  const isOurHelper = (callee: Node): string | null => {
    if (callee.type === 'Identifier' && helperNames.has(callee.name as string)) return callee.name as string;
    if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      (callee.object as Node).type === 'Identifier' &&
      namespaces.has((callee.object as Node).name as string)
    ) {
      const prop = (callee.property as Node).name as string;
      if (options.helpers.includes(prop)) return prop;
    }
    return null;
  };

  walk(program, (node) => {
    if (node.type === 'JSXOpeningElement' && isOurComponent(node.name as Node)) {
      for (const attr of node.attributes as Node[]) {
        if (attr.type !== 'JSXAttribute' || (attr.name as Node).name !== 'icon' || !attr.value) continue;
        if (bakeExpression(attr.value as Node)) {
          touched = true;
          // `icon="mdi:home"` → the literal was overwritten with an identifier; wrap it in braces.
          const value = attr.value as Node;
          if (value.type === 'Literal') {
            s.appendLeft(value.start, '{');
            s.appendRight(value.end, '}');
          }
        }
      }
    } else if (node.type === 'CallExpression') {
      const helper = isOurHelper(node.callee as Node);
      if (!helper) return;
      const args = node.arguments as Node[];
      const first = args[0];
      if (!first) return;
      if (first.type === 'ArrayExpression') {
        // bakeIcons(["a:b", "c:d"]) → { "a:b": $bi_a_b, "c:d": $bi_c_d }
        const entries: string[] = [];
        let ok = true;
        for (const el of first.elements as (Node | null)[]) {
          if (!el || el.type !== 'Literal' || typeof el.value !== 'string' || !isIconName(el.value)) {
            ok = false;
            break;
          }
          const ident = identFor(el.value);
          if (!ident) {
            ok = false;
            break;
          }
          entries.push(`${JSON.stringify(el.value)}:${ident}`);
        }
        if (ok) {
          s.overwrite(node.start, node.end, `{${entries.join(',')}}`);
          touched = true;
        }
      } else if ((first.type === 'Literal' || first.type === 'TemplateLiteral') && bakeExpression(first)) {
        // bakeIcon("a:b") → $bi_a_b  (drop the call, keep the baked value)
        s.remove(node.start, first.start);
        s.remove(first.end, node.end);
        touched = true;
      }
    }
  });

  if (!touched) return null;

  // 3. Hoist baked data to module scope (after directives & imports).
  const decls = [...baked.values()]
    .map(({ ident, data }) => `const ${ident} = ${JSON.stringify(data)};`)
    .join('\n');
  s.appendRight(insertAt, `\n/* baked-icons */\n${decls}\n`);

  return {
    code: s.toString(),
    map: s.generateMap({ source: filename, includeContent: true, hires: 'boundary' }),
    icons: [...baked.keys()],
  };
}

function walk(node: Node, visit: (node: Node) => void): void {
  visit(node);
  for (const key in node) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && typeof (item as Node).type === 'string') walk(item as Node, visit);
      }
    } else if (value && typeof value === 'object' && typeof (value as Node).type === 'string') {
      walk(value as Node, visit);
    }
  }
}
