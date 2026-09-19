// Static metadata works for link unfurlers that never execute JavaScript.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resorts } from '../src/data.ts';
import { mountainAliases } from '../src/routing.ts';
import { socialMetadata } from '../src/social.ts';
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function page(slug){
 const m=socialMetadata('/'+slug);
 const tags={'description':m.description,'og:type':'website','og:site_name':'topo.ski','og:title':m.title,'og:description':m.description,'og:url':m.url,'og:image':m.image,'og:image:type':'image/jpeg','og:image:width':'1200','og:image:height':'630','og:image:alt':m.imageAlt,'twitter:card':'summary_large_image','twitter:title':m.title,'twitter:description':m.description,'twitter:image':m.image,'twitter:image:alt':m.imageAlt};
 const metadata=`<!-- social:start -->\n<title>${esc(m.title)}</title>\n<link rel="canonical" href="${esc(m.url)}" />\n`+Object.entries(tags).map(([key,value])=>`<meta ${key.startsWith('og:')?'property':'name'}="${key}" content="${esc(value)}" />`).join('\n')+'\n<!-- social:end -->';
 return html.replace(/<!-- social:start -->[\s\S]*?<!-- social:end -->/,metadata);
}
await writeFile(new URL('../dist/index.html',import.meta.url),page(''));
for (const slug of [...resorts.map(r => r.id), ...Object.keys(mountainAliases), 'about']) {
 const directory = new URL(`../dist/${slug}/`, import.meta.url);
 await mkdir(directory, { recursive: true });
 await writeFile(new URL('index.html', directory), page(slug));
}
