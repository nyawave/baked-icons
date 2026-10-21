import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import loader from '../src/loader.ts';
import { withBakedIcons } from '../src/next.ts';
import bakedIcons from '../src/vite.ts';

const code = `import { bakeIcon } from '@nyawave/baked-icons'; export const s = bakeIcon("my:star");`;

function tempSet(): { dir: string; file: string } {
  const dir = mkdtempSync(join(tmpdir(), 'baked-icons-'));
  const file = join(dir, 'set.json');
  writeFileSync(file, JSON.stringify({ prefix: 'my', icons: { star: { body: '<s/>' } } }));
  return { dir, file };
}

describe('loader', () => {
  it('reuses one transformer for equal options objects and reports dependencies', () => {
    const { dir, file } = tempSet();
    try {
      const run = () => {
        const deps: string[] = [];
        let output: string | undefined;
        loader.call(
          {
            resourcePath: join(dir, 'a.ts'),
            rootContext: dir,
            // fresh object per call, like Turbopack
            getOptions: () => ({ iconSets: { my: './set.json' } }),
            callback: (err, content) => {
              if (err) throw err;
              output = content;
            },
            addDependency: (f) => deps.push(f),
          },
          code,
        );
        return { output: output!, deps };
      };
      utimesSync(file, 1000, 1000);
      const first = run();
      expect(first.output).toContain('const $bi_my$star = {"body":"<s/>"');
      expect(first.deps).toEqual([file]);
      // same mtime: only a new transformer would re-read it
      writeFileSync(file, JSON.stringify({ prefix: 'my', icons: { star: { body: '<x/>' } } }));
      utimesSync(file, 1000, 1000);
      expect(run().output).toContain('<s/>');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('vite plugin', () => {
  it('uses a native pre-filter, watches set files and invalidates on change', () => {
    const { dir, file } = tempSet();
    try {
      const plugin = bakedIcons({ iconSets: { my: './set.json' } });
      (plugin.configResolved as (c: { root: string }) => void)({ root: dir });
      const hook = plugin.transform as unknown as {
        filter: { id: { include: RegExp; exclude: RegExp }; code: { include: string[] } };
        handler: (this: { addWatchFile(f: string): void }, code: string, id: string) => { code: string } | null;
      };
      expect(hook.filter.code.include).toEqual(['@nyawave/baked-icons']);
      expect(hook.filter.id.include.test('/x/a.tsx?v=1')).toBe(true);
      expect(hook.filter.id.exclude.test('/node_modules/x/a.js')).toBe(true);

      const watched: string[] = [];
      const ctx = { addWatchFile: (f: string) => watched.push(f) };
      expect(hook.handler.call(ctx, code, join(dir, 'a.ts'))!.code).toContain('<s/>');
      expect(watched).toEqual([file]);

      writeFileSync(file, JSON.stringify({ prefix: 'my', icons: { star: { body: '<t/>' } } }));
      (plugin.watchChange as (id: string) => void)(file);
      expect(hook.handler.call(ctx, code, join(dir, 'a.ts'))!.code).toContain('<t/>');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('withBakedIcons', () => {
  it('wraps object configs', () => {
    const config = withBakedIcons({ reactStrictMode: true }) as unknown as { turbopack: { rules: Record<string, unknown> } };
    expect(Object.keys(config.turbopack.rules)).toEqual(['*.tsx', '*.jsx', '*.ts', '*.js']);
  });

  it('wraps function configs (sync and async)', async () => {
    const sync = withBakedIcons((phase: string) => ({ env: { phase } }));
    const resolved = (await (sync as unknown as (p: string) => Promise<{ env: { phase: string }; turbopack: unknown }>)('build'));
    expect(resolved.env.phase).toBe('build');
    expect(resolved.turbopack).toBeDefined();
    const async = withBakedIcons(async () => ({ basePath: '/x' }));
    expect(await (async as unknown as () => Promise<{ basePath: string; webpack: unknown }>)()).toMatchObject({ basePath: '/x' });
  });
});
