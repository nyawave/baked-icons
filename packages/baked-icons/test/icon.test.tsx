import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon, InlineIcon, addCollection, addIcons, getIcon, type BakedIcon } from '../src/index.ts';

const home: BakedIcon = {
  body: '<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>',
  width: 24,
  height: 24,
  name: 'mdi:home',
};

describe('<Icon />', () => {
  it('renders an inline svg with iconify defaults', () => {
    const html = renderToStaticMarkup(<Icon icon={home} />);
    expect(html).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('width="1em" height="1em"');
    expect(html).toContain('class="iconify iconify--mdi"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(home.body);
  });

  it('applies customisations', () => {
    const html = renderToStaticMarkup(
      <Icon icon={home} width={32} rotate={1} flip="horizontal" color="red" className="x" title="Home" />,
    );
    expect(html).toContain('width="32" height="32"');
    expect(html).toContain('<g transform="rotate(90 12 12) translate(24 0) scale(-1 1)">');
    expect(html).toContain('color:red');
    expect(html).toContain('<title>Home</title>');
    expect(html).not.toContain('aria-hidden');
    expect(html).toContain('class="iconify iconify--mdi x"');
  });

  it('InlineIcon aligns to baseline', () => {
    expect(renderToStaticMarkup(<InlineIcon icon={home} />)).toContain('vertical-align:-0.125em');
  });

  it('resolves strings from the runtime registry and renders nothing otherwise', () => {
    expect(renderToStaticMarkup(<Icon icon="mdi:home" />)).toBe('');
    addIcons({ 'mdi:home': home });
    expect(renderToStaticMarkup(<Icon icon="mdi:home" />)).toContain('viewBox="0 0 24 24"');
  });

  it('makes ids unique and deterministic', () => {
    const grad: BakedIcon = {
      body: '<defs><linearGradient id="a"><stop/></linearGradient></defs><rect fill="url(#a)" width="16" height="16"/>',
    };
    const html = renderToStaticMarkup(<><Icon icon={grad} /><Icon icon={grad} /></>);
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
    expect(html).toContain(`url(#${ids[0]})`);
    expect(html).toContain(`url(#${ids[1]})`);
    expect(renderToStaticMarkup(<><Icon icon={grad} /><Icon icon={grad} /></>)).toBe(html);
  });

  it('keeps every partial collection added for a prefix, latest first', () => {
    addCollection({ prefix: 'pc', icons: { a: { body: '<a/>' }, shared: { body: '<old/>' } } });
    expect(getIcon('pc:shared')!.body).toBe('<old/>');
    addCollection({
      prefix: 'pc',
      width: 24,
      icons: { b: { body: '<b/>' }, shared: { body: '<new/>' } },
      aliases: { 'b-flipped': { parent: 'b', hFlip: true } },
    });
    expect(getIcon('pc:a')).toEqual({ body: '<a/>', name: 'pc:a' });
    expect(getIcon('pc:shared')!.body).toBe('<new/>');
    expect(getIcon('pc:b-flipped')).toEqual({ body: '<b/>', width: 24, hFlip: true, name: 'pc:b-flipped' });
    expect(getIcon('pc:missing')).toBeNull();
    expect(getIcon('pc:constructor')).toBeNull();
  });

  it('renders the same icon with different customisations correctly (render cache)', () => {
    const a = renderToStaticMarkup(<Icon icon={home} width={48} />);
    const b = renderToStaticMarkup(<Icon icon={home} rotate="90deg" />);
    const c = renderToStaticMarkup(<Icon icon={home} width={48} />);
    expect(a).toContain('width="48" height="48"');
    expect(b).toContain('rotate(90 12 12)');
    expect(b).not.toContain('width="48"');
    expect(c).toBe(a);
    for (let i = 0; i < 40; i++) renderToStaticMarkup(<Icon icon={home} width={i} />);
    expect(renderToStaticMarkup(<Icon icon={home} width={48} />)).toBe(a);
  });

  it('keeps all <defs> outside the transform group', () => {
    const icon: BakedIcon = {
      body: '<defs><clipPath id="c"><path d="M0 0"/></clipPath></defs><g clip-path="url(#c)"/><defs><linearGradient id="g"/></defs><path fill="url(#g)"/>',
    };
    const html = renderToStaticMarkup(<Icon icon={icon} rotate={1} />);
    const inner = html.slice(html.indexOf('>') + 1, html.lastIndexOf('</svg>'));
    expect(inner.startsWith('<defs><clipPath')).toBe(true);
    expect(inner).toMatch(/^<defs>.*<\/defs><g transform="rotate\(90 8 8\)">(?!.*<defs).*<\/g>$/);
    expect(inner.match(/<\/clipPath>/g)).toHaveLength(1);
  });
});
