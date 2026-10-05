import { GUIDES, NPM_URL, ORG, REPO_URL } from '@/lib/content';
import { CopyInstallPill, CopyPromptButton } from './copy';

export function SiteFooter() {
  return (
    <footer className="footer">
      <span>
        MIT license. Built by{' '}
        <a href={ORG.url} className="footer-author">
          {ORG.name}
        </a>
        .
      </span>
      <nav aria-label="Guides">
        {GUIDES.map((g) => (
          <a key={g.href} href={g.href}>
            {g.footer}
          </a>
        ))}
      </nav>
      <nav aria-label="Project">
        <a href={REPO_URL}>GitHub</a>
        <a href={NPM_URL}>npm</a>
        <a href={`${REPO_URL}/blob/main/CHANGELOG.md`}>Changelog</a>
        <a href={`${REPO_URL}/issues`}>Issues</a>
        <a href="/llms.txt">llms.txt</a>
      </nav>
    </footer>
  );
}

export function CtaFooter() {
  return (
    <div className="wrap cta-wrap">
      <section className="cta" aria-labelledby="cta-title">
        <h2 id="cta-title" className="disp cta-title">
          Ship icons that are already there
        </h2>
        <div className="cta-actions">
          <CopyInstallPill />
          <CopyPromptButton className="hit btn cta-prompt" label="Copy AI agent prompt" copiedLabel="Prompt copied" />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
