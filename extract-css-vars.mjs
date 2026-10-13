import fs from 'fs';
const css = fs.readFileSync('E:/copy/original-index.css', 'utf8');
const vars = [...css.matchAll(/--([a-z0-9-]+):\s*([^;}{]+)/gi)].map((m) => m[0]);
console.log([...new Set(vars)].slice(0, 80).join('\n'));
const colors = [...css.matchAll(/#([0-9a-fA-F]{3,8})\b/g)].map((m) => '#' + m[1]);
const freq = {};
for (const c of colors) freq[c] = (freq[c] || 0) + 1;
console.log('\nTOP COLORS:');
console.log(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([c, n]) => `${c} ${n}`).join('\n'));
