import { resorts } from './data.ts';
const ids = new Set(resorts.map(resort => resort.id));
export const mountainAliases: Record<string, string> = { iwawai: 'iwanai' };
export function mountainRoute(pathname: string, hash = ''): string | undefined {
  let slug: string;
  try { slug = decodeURIComponent(hash.length > 1 ? hash.slice(1) : pathname.replace(/^\/|\/$/g, '')).toLowerCase(); }
  catch { return undefined; }
  slug = mountainAliases[slug] ?? slug;
  return ids.has(slug) ? slug : undefined;
}
