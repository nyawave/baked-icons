import type { MetadataRoute } from 'next';
import { GUIDES, UPDATED } from '@/lib/content';
import { url } from '@/lib/seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: url('/'), lastModified: UPDATED, changeFrequency: 'monthly', priority: 1 },
    ...GUIDES.map((g) => ({ url: url(g.href), lastModified: UPDATED, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
