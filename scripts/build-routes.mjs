// Real entry files let mountain URLs refresh on static hosts without SPA rewrites.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resorts } from '../src/data.ts';
import { mountainAliases } from '../src/routing.ts';
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
for (const slug of [...resorts.map(r => r.id), ...Object.keys(mountainAliases)]) {
 const directory = new URL(`../dist/${slug}/`, import.meta.url);
 await mkdir(directory, { recursive: true });
 await writeFile(new URL('index.html', directory), html);
}
