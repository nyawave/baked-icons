/**
 * Deterministic variant of Iconify's `replaceIDs`: ids become `prefix + index`,
 * so SSR and client markup match (prefix comes from `useId()`).
 */
export interface IdPlan {
  re: RegExp;
  index: Map<string, number>;
}

const ID_RE = /\sid="(\S+)"/g;

export function planIDs(body: string): IdPlan | null {
  if (!body.includes('id=')) return null;
  const index = new Map<string, number>();
  let n = 0;
  for (const match of body.matchAll(ID_RE)) {
    if (!index.has(match[1]!)) index.set(match[1]!, n);
    n++;
  }
  if (!n) return null;
  // the terminator group stops `a` from matching inside `ab`, so one pass is enough
  const alternatives = [...index.keys()].map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return { re: new RegExp(`([#;"])(${alternatives})([")]|\\.[a-z])`, 'g'), index };
}

export function applyIDs(body: string, plan: IdPlan, prefix: string): string {
  return body.replace(plan.re, (_, before: string, id: string, after: string) => before + prefix + plan.index.get(id) + after);
}

export function replaceIDs(body: string, prefix: string): string {
  const plan = planIDs(body);
  return plan ? applyIDs(body, plan, prefix) : body;
}
