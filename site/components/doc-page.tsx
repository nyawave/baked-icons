import type { ReactNode } from 'react';
import { GUIDES, ORG, UPDATED } from '@/lib/content';
import { breadcrumbLd, graph, OG_IMAGE, ORG_LD, SOFTWARE_LD, url } from '@/lib/seo';
import { Faq, faqJsonLd, type FaqItem } from './faq';
import { JsonLd } from './json-ld';
import { CtaFooter } from './footer';
import { SiteHeader } from './site-header';

interface DocPageProps {
  path: string;
  crumb: string;
  title: string;
  description: string;
  lead: ReactNode;
  toc: { id: string; label: string }[];
  faq?: FaqItem[];
  children: ReactNode;
}

const updatedLabel = new Date(`${UPDATED}T00:00:00Z`).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function DocPage({ path, crumb, title, description, lead, toc, faq, children }: DocPageProps) {
  const article = {
    '@type': 'TechArticle',
    '@id': `${url(path)}#article`,
    headline: title,
    description,
    url: url(path),
    mainEntityOfPage: url(path),
    image: url(OG_IMAGE.url),
    inLanguage: 'en',
    datePublished: UPDATED,
    dateModified: UPDATED,
    author: { '@id': ORG_LD['@id'] },
    publisher: { '@id': ORG_LD['@id'] },
    about: { '@id': SOFTWARE_LD['@id'] },
    proficiencyLevel: 'Beginner',
  };
  const nodes: object[] = [
    article,
    breadcrumbLd([
      { name: 'baked-icons', path: '/' },
      { name: crumb, path },
    ]),
    ORG_LD,
    SOFTWARE_LD,
  ];
  if (faq) nodes.push(faqJsonLd(faq));
  const others = GUIDES.filter((g) => g.href !== path);

  return (
    <>
      <JsonLd data={graph(...nodes)} />
      <SiteHeader current={path} />
      <main className="wrap doc">
        <nav aria-label="Breadcrumb" className="crumbs">
          <ol>
            <li>
              <a href="/">baked-icons</a>
            </li>
            <li aria-current="page">{crumb}</li>
          </ol>
        </nav>
        <header className="doc-head">
          <h1 className="disp doc-title">{title}</h1>
          <p className="doc-lead">{lead}</p>
          <p className="doc-meta">
            Updated <time dateTime={UPDATED}>{updatedLabel}</time> by{' '}
            <a href={ORG.url}>{ORG.name}</a>
          </p>
        </header>
        <div className="doc-grid">
          <article className="prose">
            {children}
            {faq && (
              <section aria-labelledby="faq">
                <h2 id="faq">FAQ</h2>
                <Faq items={faq} />
              </section>
            )}
          </article>
          <aside className="doc-aside">
            <nav aria-label="On this page" className="toc">
              <p className="aside-label">On this page</p>
              <ul>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </li>
                ))}
                {faq && (
                  <li>
                    <a href="#faq">FAQ</a>
                  </li>
                )}
              </ul>
            </nav>
            <nav aria-label="Other guides" className="toc">
              <p className="aside-label">Other guides</p>
              <ul>
                {others.map((g) => (
                  <li key={g.href}>
                    <a href={g.href}>{g.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </main>
      <CtaFooter />
    </>
  );
}
