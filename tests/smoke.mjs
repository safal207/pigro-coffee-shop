import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const html = readFileSync('index.html','utf8');
assert.match(html, /<html\s+lang=/i, 'html must declare language');
assert.match(html, /<meta\s+name="viewport"/, 'viewport is required');
assert.match(html, /<style>[^]*<\/style>/, 'inline CSS expected');
assert.match(html, /<script>[^]*<\/script>/, 'inline JS expected');
assert.match(html, /assets\/pigro-sloth\.webp/, 'cacheable original brand image expected');
assert.doesNotMatch(html, /data:image\/webp;base64,/, 'do not inline heavy photos');
assert.match(html, /pigro/i, 'brand name required');
assert.match(html, /localStorage/, 'cart/favorites persistence required');
assert.match(html, /renderAll\(\)/, 'app entrypoint required');
const s=html.match(/<script>([^]*?)<\/script>/i);
assert.ok(s, 'script not found');
const tmp=mkdtempSync(join(tmpdir(),'pigro-'));
try { const file=join(tmp,'inline.js'); writeFileSync(file,s[1]); execFileSync(process.execPath,['--check',file],{stdio:'pipe'}); }
finally { rmSync(tmp,{recursive:true,force:true}); }
console.log('PASS: HTML, cached assets and JavaScript syntax OK');
