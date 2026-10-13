import fs from 'fs';
const js = fs.readFileSync('E:/copy/original-index.js', 'utf8');
const paths = [...js.matchAll(/path:"(\/[^"]*)"/g)].map((m) => m[1]);
console.log('ROUTES:', [...new Set(paths)].sort().join('\n'));
const nav = [...js.matchAll(/to:"(\/[^"]*)",children:"([^"]{2,30})"/g)];
console.log('\nNAV LINKS:');
for (const [, to, label] of nav) console.log(to, label);
