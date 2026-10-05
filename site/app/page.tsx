import { faqJsonLd } from '@/components/faq';
import { CtaFooter } from '@/components/footer';
import { Hero } from '@/components/hero';
import { JsonLd } from '@/components/json-ld';
import { PmProvider } from '@/components/pm-context';
import {
  CompareSection,
  FaqSection,
  HowSection,
  MigrateSection,
  PlaygroundSection,
  SetupSection,
  WhySection,
} from '@/components/sections';
import { SiteHeader } from '@/components/site-header';
import { WorksWith } from '@/components/works-with';
import { HOME_FAQ } from '@/lib/faq';
import { graph, ORG_LD, SOFTWARE_LD, WEBSITE_LD } from '@/lib/seo';

export default function Home() {
  return (
    <PmProvider>
      <JsonLd data={graph(WEBSITE_LD, SOFTWARE_LD, ORG_LD, faqJsonLd(HOME_FAQ))} />
      <SiteHeader />
      <main>
        <Hero />
        <WorksWith />
        <PlaygroundSection />
        <HowSection />
        <SetupSection />
        <WhySection />
        <MigrateSection />
        <CompareSection />
        <FaqSection />
      </main>
      <CtaFooter />
    </PmProvider>
  );
}
