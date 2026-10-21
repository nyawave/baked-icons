import { parseSync } from 'oxc-parser';
import { SourceEdits, SourceMap } from './edits.ts';
import { IconResolver, isIconName, parseIconName } from './resolve.ts';
import { type BakeOptions, type BakedIcon, type ResolvedBakeOptions, resolveOptions } from './types.ts';

export type { BakeOptions, BakedIcon } from './types.ts';
export { IconResolver, isIconName } from './resolve.ts';
export { SourceMap } from './edits.ts';

export interface TransformResult {
  code: string;
  map: SourceMap;
  /** Names of icons that were baked into this module. */
  icons: string[];
  /** Icon set files used; report them to the bundler as dependencies. */
  dependencies: string[];
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
export function createTransformer(options: BakeOptions = {}): Transformer {
  const resolved = resolveOptions(options);
  const resolver = new IconResolver(resolved);
  return {
    options: resolved,
    transform: (code, id) => transformSource(code, id, resolved, resolver),
    invalidate: (file) => resolver.invalidate(file),
  };
}

export interface Transformer {
  transform: (code: string, id: string) => TransformResult | null;
  options: ResolvedBakeOptions;
  /** Drops sets read from `file`; without it, sets whose file changed on disk. */
  invalidate: (file?: string) => boolean;
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
  //    Decls go after the leading directives/imports, before any code (TDZ).
  const componentNames = new Set<string>();
  const helperNames = new Set<string>();
  const namespaces = new Set<string>();
  let insertAt = (program.hashbang as Node | null | undefined)?.end ?? 0;
  let leading = true;

  for (const stmt of program.body as Node[]) {
    const isDirective = stmt.type === 'ExpressionStatement' && typeof stmt.directive === 'string';
    const isImport = stmt.type === 'ImportDeclaration';
    if (leading && (isDirective || isImport)) insertAt = stmt.end;
    else leading = false;
    if (!isImport || stmt.importKind === 'type') continue;
    const source = (stmt.source as Node).value as string;
    if (!options.sources.includes(source)) continue;
    for (const spec of stmt.specifiers as Node[]) {
      const local = (spec.local as Node).name as string;
      if (spec.type === 'ImportNamespaceSpecifier') {
        namespaces.add(local);
      } else if (spec.type === 'ImportSpecifier' && spec.importKind !== 'type') {
        const imported = spec.imported as Node;
        const name = (imported.type === 'Identifier' ? imported.name : imported.value) as string;
        if (options.components.includes(name)) componentNames.add(local);
        if (options.helpers.includes(name)) helperNames.add(local);
      }
    }
  }
  if (!componentNames.size && !helperNames.size && !namespaces.size) return null;

  // 2. Walk & collect edits.
  const edits = new SourceEdits(code);
  const baked = new Map<string, { ident: string; data: BakedIcon }>();
  const idents = new Set<string>();

  const identFor = (name: string, at: number): string | null => {
    const existing = baked.get(name);
    if (existing) return existing.ident;
    const data = resolver.resolve(name);
    if (!data) {
      const message = `[baked-icons] ${resolver.hint(name)}\n  at ${filename}:${position(code, at)}`;
      if (options.onMissing === 'error') throw new Error(message);
      if (options.onMissing === 'warn') console.warn(message);
      return null;
    }
    // `:` → `$` keeps `a-b:c` and `a:b-c` apart; `$n` suffix avoids user identifiers
    const base = `$bi_${name.split(':').join('$').replace(/-/g, '_')}`;
    let ident = base;
    for (let i = 2; idents.has(ident) || code.includes(ident); i++) ident = `${base}$${i}`;
    idents.add(ident);
    baked.set(name, { ident, data });
    return ident;
  };

  /** Replace a string-literal-ish expression with a baked identifier. Returns true if replaced. */
  const bakeExpression = (node: Node, braces = false): boolean => {
    switch (node.type) {
      case 'Literal':
      case 'TemplateLiteral': {
        const value = staticString(node);
        if (value === null || !isIconName(value)) return false;
        const ident = identFor(value, node.start);
        if (!ident) return false;
        edits.replace(node.start, node.end, braces ? `{${ident}}` : ident);
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
      case 'TSTypeAssertion':
      case 'ParenthesizedExpression':
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

  const isOurHelper = (callee: Node): boolean => {
    callee = unwrap(callee);
    if (callee.type === 'Identifier') return helperNames.has(callee.name as string);
    return (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      (callee.object as Node).type === 'Identifier' &&
      namespaces.has((callee.object as Node).name as string) &&
      options.helpers.includes((callee.property as Node).name as string)
    );
  };

  // returning false skips children of a node that was replaced whole
  walk(program, (node) => {
    if (node.type === 'JSXOpeningElement') {
      if (!isOurComponent(node.name as Node)) return true;
      for (const attr of node.attributes as Node[]) {
        if (attr.type !== 'JSXAttribute' || (attr.name as Node).name !== 'icon' || !attr.value) continue;
        const value = attr.value as Node;
        bakeExpression(value, value.type === 'Literal');
      }
      return true;
    }
    if (node.type !== 'CallExpression' || !isOurHelper(node.callee as Node)) return true;
    const first = (node.arguments as Node[])[0];
    if (!first || first.type === 'SpreadElement') return true;
    const arg = unwrap(first);
    if (arg.type === 'ArrayExpression') {
      // bakeIcons(["a:b", "c:d"]) → {"a:b":$bi_a$b,"c:d":$bi_c$d}
      const elements = arg.elements as (Node | null)[];
      const values = elements.map((el) => (el ? staticString(unwrap(el)) : null));
      if (!values.every((value) => value !== null && isIconName(value))) return true;
      const entries: string[] = [];
      for (let i = 0; i < values.length; i++) {
        const ident = identFor(values[i]!, elements[i]!.start);
        if (!ident) return true;
        entries.push(`${JSON.stringify(values[i])}:${ident}`);
      }
      edits.replace(node.start, node.end, `{${entries.join(',')}}`);
      return false;
    }
    // bakeIcon("a:b") → $bi_a$b
    const value = staticString(arg);
    if (value === null || !isIconName(value)) return true;
    const ident = identFor(value, arg.start);
    if (!ident) return true;
    edits.replace(node.start, node.end, ident);
    return false;
  });

  if (!edits.size) return null;

  // 3. Hoist baked data to module scope.
  const decls = [...baked.values()]
    .map(({ ident, data }) => `const ${ident} = ${JSON.stringify(data)};`)
    .join('\n');
  edits.insert(insertAt, `\n/* baked-icons */\n${decls}\n`);

  const dependencies = new Set<string>();
  for (const name of baked.keys()) {
    const file = resolver.fileOf(parseIconName(name)!.prefix);
    if (file) dependencies.add(file);
  }

  const result = edits.apply(filename);
  return { code: result.code, map: result.map, icons: [...baked.keys()], dependencies: [...dependencies] };
}

function unwrap(node: Node): Node {
  while (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSTypeAssertion'
  ) {
    node = node.expression as Node;
  }
  return node;
}

function staticString(node: Node): string | null {
  if (node.type === 'Literal') return typeof node.value === 'string' ? node.value : null;
  if (node.type === 'TemplateLiteral' && !(node.expressions as Node[]).length) {
    return ((node.quasis as Node[])[0]?.value as { cooked: string | null } | undefined)?.cooked ?? null;
  }
  return null;
}

function position(code: string, offset: number): string {
  let line = 1;
  let lineStart = 0;
  for (let i = code.indexOf('\n'); i >= 0 && i < offset; i = code.indexOf('\n', i + 1)) {
    line++;
    lineStart = i + 1;
  }
  return `${line}:${offset - lineStart + 1}`;
}

function walk(node: Node, visit: (node: Node) => boolean): void {
  if (!visit(node)) return;
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
