/**
 * Deterministic variant of Iconify's `replaceIDs`: rewrites `id="…"`
 * attributes (and every `#id` / `url(#id)` reference) with `prefix + index`.
 * Being deterministic matters for SSR: the server and the client must produce
 * identical markup, so we derive the prefix from React's `useId()`.
 */
export function replaceIDs(body: string, prefix: string): string {
  const ids: string[] = [];
  const idRe = /\sid="(\S+)"/g;
  let match: RegExpExecArray | null;
  while ((match = idRe.exec(body))) ids.push(match[1]!);
  if (!ids.length) return body;

  // Temporary suffix prevents double replacement when one id is a prefix of another.
  const suffix = '\u0000';
  ids.forEach((id, index) => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    body = body.replace(new RegExp(`([#;"])(${escaped})([")]|\\.[a-z])`, 'g'), `$1${prefix}${index}${suffix}$3`);
  });
  return body.split(suffix).join('');
}
