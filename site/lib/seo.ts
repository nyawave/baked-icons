import type { Metadata } from 'next';
import { DESCRIPTION, NPM_URL, OG_ALT, OG_SIZE, ORG, PACKAGE, REPO_URL, SITE_URL, VERSION } from './content';

export const OG_IMAGE = { url: '/og.png', type: 'image/png', alt: OG_ALT, ...OG_SIZE };

export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      siteName: 'baked-icons',
      title,
      description,
      locale: 'en_US',
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  };
}

export const url = (path: string) => (path === '/' ? SITE_URL : `${SITE_URL}${path}`);

export const ORG_LD = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#org`,
  name: ORG.name,
  url: ORG.url,
  logo: ORG.logo,
  sameAs: [ORG.url],
};

export const SOFTWARE_LD = {
  '@type': 'SoftwareSourceCode',
  '@id': `${SITE_URL}/#software`,
  name: 'baked-icons',
  alternateName: PACKAGE,
  description: DESCRIPTION,
  url: url('/'),
  codeRepository: REPO_URL,
  license: 'https://opensource.org/licenses/MIT',
  programmingLanguage: { '@type': 'ComputerLanguage', name: 'TypeScript' },
  runtimePlatform: 'Node.js',
  version: VERSION,
  keywords: 'iconify, react, icons, svg, nextjs, vite, webpack, server components, ssr',
  author: { '@id': ORG_LD['@id'] },
  sameAs: [NPM_URL, REPO_URL],
};

export const WEBSITE_LD = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'baked-icons',
  url: url('/'),
  inLanguage: 'en',
  about: { '@id': SOFTWARE_LD['@id'] },
  publisher: { '@id': ORG_LD['@id'] },
};

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: url(item.path) })),
  };
}

export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
