import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsPath = path.join(root, 'reference', 'original-index.js');
const js = fs.readFileSync(jsPath, 'utf8');
const paths = [...js.matchAll(/path:"(\/[^"]*)"/g)].map((m) => m[1]);
console.log('ROUTES:', [...new Set(paths)].sort().join('\n'));
const nav = [...js.matchAll(/to:"(\/[^"]*)",children:"([^"]{2,30})"/g)];
console.log('\nNAV LINKS:');
for (const [, to, label] of nav) console.log(to, label);
