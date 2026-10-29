import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const match of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
  const [, kind, url] = match;
  if (url.startsWith('#')) { assert.ok(ids.has(url.slice(1)), `Missing anchor ${url}`); continue; }
  if (/^(https?:|mailto:)/.test(url)) {
    assert.equal(kind, 'href', `External runtime resource ${url}`);
    continue;
  }
  assert.ok(existsSync(resolve(root, url)), `Missing public asset ${url}`);
}
assert.ok(!existsSync(join(root, 'data/face-landmarks.json')), 'Retired face geometry must not be published');
assert.ok(!existsSync(join(root, 'images/portrait.jpg')), 'Retired portrait must not be published');
assert.ok(existsSync(join(root, 'images/portrait-refined.png')), 'The requested portrait must be bundled locally');
for (const page of ['home', 'about', 'projects', 'skills', 'education', 'contact']) {
  assert.ok(html.includes(`data-page="${page}"`), `Missing destination ${page}`);
}
assert.equal([...html.matchAll(/data-project="\d+"/g)].length, 7, 'Expected seven project cards');
const cssFiles = readdirSync(join(root, 'assets')).filter(x => x.endsWith('.css'));
for (const file of cssFiles) {
  const css = readFileSync(join(root, 'assets', file), 'utf8');
  assert.ok(!/url\(\s*["']?https?:/i.test(css), 'Remote CSS resource');
}
const scripts = readdirSync(join(root, 'assets')).filter(x => x.endsWith('.js'));
assert.ok(scripts.every(file => !/createNetwork|WebGLRenderer/.test(readFileSync(join(root, 'assets', file), 'utf8'))), 'The retired network scene must not enter the page bundle');
function size(dir) { return readdirSync(dir).reduce((sum, name) => {
  const path = join(dir, name); return sum + (statSync(path).isDirectory() ? size(path) : statSync(path).size);
}, 0); }
assert.ok(!existsSync(join(root, 'Assets/FaceSources')), 'Preparation assets must not be deployed');
assert.ok(!existsSync(join(root, '.tools')), 'Preparation dependencies must not be deployed');
console.log(`Static asset audit passed. All local links and anchors resolve. Total dist: ${(size(root) / 1024).toFixed(0)} KiB.`);
console.log('This source/build audit does not replace browser network or visual verification.');
