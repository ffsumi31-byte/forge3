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
  assert.match(html, /\/vendor\/three\/build\/three\.module\.js/);
  assert.match(html, /src="\/src\/main\.js"/);
  assert.doesNotMatch(html, /sk-[A-Za-z0-9]{10,}/);
});
test('modeler has character, creature, weapon, and prop shape paths', async () => {
  const source = await read('src/modeler.js');
  for (const token of ['makeHumanoid', 'makeDragon', 'makeHorse', 'makeMarine', 'makeOctopus', 'makeWeapon', 'makeProp', 'enforceBudget', 'getMeshStats', 'silhouette-first', 'hard planar faces']) assert.ok(source.includes(token), `Missing ${token}`);
  assert.match(source, /clamp\(Number\(triangleBudget\) \|\| 500, 100, 500\)/);
});
test('hosting config supports Render Web Service without Root Directory settings', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const vercel = JSON.parse(await read('vercel.json'));
  const render = await read('render.yaml');
  assert.equal(pkg.scripts.build, 'node build.mjs');
  assert.equal(pkg.scripts.start, 'node build.mjs && node server.mjs');
  assert.ok(pkg.dependencies.three, 'Three.js must be installed for building and tests');
  assert.equal(vercel.installCommand, 'npm install');
  assert.equal(vercel.outputDirectory, 'dist');
  assert.match(render, /runtime: node/);
  assert.match(render, /buildCommand: npm install/);
  assert.match(render, /startCommand: npm start/);
});
test('exports and feedback memory are wired into the UI', async () => {
  const main = await read('src/main.js');
  for (const token of ['GLTFExporter', 'exportOBJ', 'exportLua', 'forge3d-library', 'forge3d-preferences', 'imageColorFromUrl']) assert.ok(main.includes(token), `Missing ${token}`);
});
