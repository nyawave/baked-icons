export interface FaqItem {
  q: string;
  a: string;
  link?: { href: string; label: string };
}

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function Faq({ items, headingLevel = 3 }: { items: readonly FaqItem[]; headingLevel?: 3 | 4 }) {
  const H = headingLevel === 3 ? 'h3' : 'h4';
  return (
    <div className="faq">
      {items.map((item) => (
        <div key={item.q} className="faq-item">
          <H className="disp faq-q">{item.q}</H>
          <div className="faq-a">
            <p>{item.a}</p>
            {item.link && (
              <a href={item.link.href} className="faq-link">
                {item.link.label} →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
