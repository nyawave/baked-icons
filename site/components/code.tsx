import type { ReactNode } from 'react';

const KEYWORDS =
  /^(?:import|export|default|from|const|let|function|return|type|interface|async|await|new|if|else|as|satisfies)$/;
const TOKEN = /(\/\/[^\n]*|#[^\n]*|'[^'\n]*'|"[^"\n]*"|`[^`]*`|\b[A-Za-z_$][\w$]*\b)/g;

function highlight(source: string, lang: 'ts' | 'sh'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of source.matchAll(TOKEN)) {
    const [token] = match;
    const index = match.index;
    let className: string | undefined;
    if (lang === 'sh' ? token.startsWith('#') : token.startsWith('//')) className = 'c';
    else if (/^['"`]/.test(token)) className = 's';
    else if (lang === 'ts' && KEYWORDS.test(token)) className = 'k';
    if (!className) continue;
    if (index > last) out.push(source.slice(last, index));
    out.push(
      <span key={index} className={className}>
        {token}
      </span>,
    );
    last = index + token.length;
  }
  out.push(source.slice(last));
  return out;
}

interface CodeProps {
  children: string;
  file?: string;
  lang?: 'ts' | 'sh';
}

export function Code({ children, file, lang = 'ts' }: CodeProps) {
  return (
    <figure className="doc-code">
      {file && <figcaption className="code-font">{file}</figcaption>}
      <pre className="code">{highlight(children.replace(/^\n|\n\s*$/g, ''), lang)}</pre>
    </figure>
  );
}
