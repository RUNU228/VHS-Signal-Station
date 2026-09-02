import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

// Measure exactly the script URLs advertised by the prerendered home page.
const html = readFileSync('.next/server/app/index.html', 'utf8');
const urls = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+\.js)"/g)].map(match => match[1]))];
const files = urls.map(url => {
  const bytes = readFileSync(join('.next', url.slice('/_next/'.length)));
  return { url, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
});
console.log(JSON.stringify({
  files,
  bytes: files.reduce((sum, file) => sum + file.bytes, 0),
  gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
}, null, 2));
