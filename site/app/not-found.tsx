import { Icon } from '@nyawave/baked-icons';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';
import { GUIDES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Page not found | baked-icons',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap nf">
        <section className="nf-hero" aria-labelledby="nf-title">
          <Icon icon="bi:logo-missing" width={112} className="nf-mark" />
          <span className="code-font nf-code">404 · not in the bundle</span>
          <h1 id="nf-title" className="disp nf-title">
            This page was never baked
          </h1>
          <p className="nf-text">The link is broken or the page has moved. Everything that exists is one click away.</p>
          <div className="nf-actions">
            <a href="/" className="hit btn btn-fg nf-btn">
              Back to home
            </a>
            <a href="/#faq" className="hit btn btn-soft nf-btn">
              Read the FAQ
            </a>
          </div>
        </section>
        <nav aria-label="Guides" className="nf-guides">
          {GUIDES.map((g) => (
            <a key={g.href} href={g.href} className="card hit nf-card">
              <span className="disp nf-card-title">{g.title}</span>
              <span className="nf-card-text">{g.summary}</span>
              <span className="nf-card-more">
                Open guide <Icon icon="lucide:arrow-right" width={16} />
              </span>
            </a>
          ))}
        </nav>
        <SiteFooter />
      </main>
    </>
  );
}
