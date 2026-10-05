import type { Metadata, Viewport } from 'next';
import { Funnel_Display, Funnel_Sans, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { DESCRIPTION, ORG, PACKAGE, SITE_URL, SOCIAL_TITLE, TITLE } from '@/lib/content';
import { OG_IMAGE } from '@/lib/seo';
import './globals.css';

const display = Funnel_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Funnel_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'baked-icons',
  authors: [{ name: ORG.name, url: ORG.url }],
  keywords: [PACKAGE, 'baked-icons', 'Iconify', 'React icons', 'Next.js', 'Server Components', 'SSR', 'Vite', 'SVG icons'],
  alternates: { canonical: '/' },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'baked-icons',
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#efefed' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f12' },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(_){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
