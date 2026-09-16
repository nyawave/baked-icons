import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon, InlineIcon, addIcons, type BakedIcon } from '../src/index.ts';

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
});
