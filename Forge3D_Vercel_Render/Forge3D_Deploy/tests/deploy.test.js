import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(path.join(root, p), 'utf8');

test('static app includes import map for Three.js and no API credentials', async () => {
  const html = await read('index.html');
  assert.match(html, /type="importmap"/);
  assert.match(html, /three\.module\.js/);
  assert.match(html, /src="\/src\/main\.js"/);
  assert.doesNotMatch(html, /sk-[A-Za-z0-9]{10,}/);
});
test('modeler has character, creature, weapon, and prop shape paths', async () => {
  const source = await read('src/modeler.js');
  for (const token of ['makeHumanoid', 'makeQuadruped', 'makeWeapon', 'makeProp', 'enforceBudget', 'getMeshStats']) assert.ok(source.includes(token), `Missing ${token}`);
  assert.match(source, /Math\.min\(500/);
});
test('hosting configs point to static build output', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const vercel = JSON.parse(await read('vercel.json'));
  const render = await read('render.yaml');
  assert.equal(pkg.scripts.build, 'node build.mjs');
  assert.equal(vercel.outputDirectory, 'dist');
  assert.match(render, /staticPublishPath: dist/);
});
test('exports and feedback memory are wired into the UI', async () => {
  const main = await read('src/main.js');
  for (const token of ['GLTFExporter', 'exportOBJ', 'exportLua', 'forge3d-library', 'forge3d-preferences', 'imageColorFromUrl']) assert.ok(main.includes(token), `Missing ${token}`);
});
