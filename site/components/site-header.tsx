import { Icon } from '@nyawave/baked-icons';
import { GUIDES, REPO_URL } from '@/lib/content';
import { ThemeToggle } from './theme-toggle';

const NAV = [...GUIDES.slice(0, 3).map((g) => ({ href: g.href, label: g.nav })), { href: '/#faq', label: 'FAQ' }];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="wrap header">
      <div className="header-bar">
        <a href="/" className="brand" aria-label="baked-icons home">
          <Icon icon="bi:logo" width={22} />
          <span>
            <span className="brand-a">baked</span>
            <span className="brand-b">icons</span>
          </span>
        </a>
        <nav className="navlinks" aria-label="Main">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="navlink"
              aria-current={item.href === current ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <a href={REPO_URL} className="hit gh-btn">
            <Icon icon="simple-icons:github" width={17} />
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
