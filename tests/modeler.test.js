import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, classifyPrompt, getMeshStats, hasDedicatedGeometry } from '../src/modeler.js';

const cases = [
  ['robot avatar with cyan visor', 'character'],
  ['tiny purple dragon with wings and tail', 'creature'],
  ['low-poly horse with block legs', 'creature'],
  ['fantasy sword with green blade', 'weapon'],
  ['pine tree prop', 'prop'],
  ['simple mug', 'prop']
];

test('automatic prompt classification', () => {
  for (const [prompt, expected] of cases) assert.equal(classifyPrompt(prompt), expected, prompt);
});

test('every standard example has real mesh geometry and stays <= 500 triangles', () => {
  for (const [prompt, expected] of cases) {
    const result = createModel({ prompt, triangleBudget: 500 });
    const stats = getMeshStats(result.group);
    assert.equal(result.category, expected);
    assert.ok(stats.parts > 0, `${prompt} should contain mesh parts`);
    assert.ok(stats.vertices > 0, `${prompt} should have vertices`);
    assert.ok(stats.triangles > 0, `${prompt} should have triangles`);
    assert.ok(stats.triangles <= 500, `${prompt}: ${stats.triangles} triangles`);
  }
});

test('requested 100-triangle limit is enforced', () => {
  for (const [prompt] of cases) {
    const { stats } = createModel({ prompt, triangleBudget: 100 });
    assert.ok(stats.triangles <= 100, `${prompt}: ${stats.triangles} triangles`);
  }
});

test('image palette input is accepted and generated group has a name', () => {
  const result = createModel({ prompt: 'a mint robot', imageColor: '#b36bd9', triangleBudget: 500 });
  assert.ok(result.name.length > 0);
  assert.match(result.palette.base, /^#[0-9a-f]{6}$/i);
});


test('premium grammar provides hard-surface rules and prompt scale changes proportions', () => {
  const base = createModel({ prompt: 'purple robot', triangleBudget: 500 });
  const giant = createModel({ prompt: 'giant purple robot', triangleBudget: 500 });
  assert.equal(base.group.userData.shapeStyle, 'premium');
  assert.ok(base.group.userData.designRules.includes('silhouette-first'));
  assert.ok(giant.group.scale.y > base.group.scale.y);
  assert.ok(base.stats.parts >= 12, 'premium default should preserve a multi-part asset');
});

test('specialist creature and vehicle models stay under the hard triangle cap', () => {
  const cases = ['dragon boss with sharp wings', 'armored unicorn', 'cute octopus', 'sports car'];
  for (const prompt of cases) {
    const result = createModel({ prompt, triangleBudget: 500 });
    assert.ok(result.stats.triangles <= 500, `${prompt}: ${result.stats.triangles}`);
    assert.ok(result.stats.parts >= 5, `${prompt} should retain a coherent multi-part silhouette`);
  }
});


test('feature color overrides the body hue for eyes and visors', () => {
  const cyan = createModel({ prompt: 'purple robot with cyan visor' });
  const gold = createModel({ prompt: 'blue dragon with gold eyes' });
  assert.equal(cyan.palette.glow, '#66E8FF');
  assert.equal(gold.palette.glow, '#FFD56A');
});

test('specialist grammar makes distinct non-robot assets and respects 500 triangles', () => {
  const prompts = [
    'sleek silver spaceship with cyan cockpit', 'red rocket ship with two fins', 'cartoon fighter jet with gold accents',
    'medieval stone castle with purple flags', 'woodland mushroom with glowing spots', 'black laptop with mint screen',
    'cartoon corgi with blue collar', 'tiny green stegosaurus with back plates', 'pirate sailboat with red sail',
    'mountain bicycle with silver frame', 'brass lantern with warm glowing glass', 'royal oak desk with a drawer'
  ];
  const outputs = prompts.map(prompt => createModel({ prompt, triangleBudget: 500 }));
  for (let i = 0; i < outputs.length; i++) {
    assert.ok(outputs[i].stats.parts >= 5, `${prompts[i]} should have specialist geometry`);
    assert.ok(outputs[i].stats.triangles <= 500, `${prompts[i]}: ${outputs[i].stats.triangles}`);
  }
  const signatures = outputs.map(o => `${o.category}:${o.stats.parts}:${o.group.children.map(c => c.name).slice(0, 4).join(',')}`);
  assert.ok(new Set(signatures).size >= 8, 'models should not collapse into a few reused shapes');
});

test('audit reports geometry budget and finite bounds', async () => {
  const { auditModel } = await import('../src/modeler.js');
  const result = createModel({ prompt: 'premium cartoon lighthouse with mint windows', triangleBudget: 500 });
  const audit = auditModel(result.group, 500);
  assert.ok(audit.triangles <= 500);
  assert.ok(audit.parts > 0);
  assert.equal(audit.invalidVertices, 0);
  assert.equal(audit.emptyMeshes, 0);
});

test('remix variation is recorded and proportion modifiers are supported', () => {
  const a = createModel({ prompt: 'cartoon dragon with wide wings', variation: 1, triangleBudget: 500 });
  const b = createModel({ prompt: 'cartoon dragon with wide wings', variation: 2, triangleBudget: 500 });
  assert.equal(a.group.userData.variation, 1);
  assert.equal(b.group.userData.variation, 2);
  assert.ok(a.stats.triangles <= 500 && b.stats.triangles <= 500);
});


test('unknown objects can be assembled from a bounded local-AI geometry plan', () => {
  const prompt = 'a handheld gravimetric analyzer with twin sensor prongs and a grip';
  assert.equal(hasDedicatedGeometry(prompt, 'prop'), false, 'novel noun should use the custom AI composition path');
  const blueprint = {
    subject: 'gravimetric analyzer',
    proportions: { headScale: 1, bodyWidth: 1.08, limbLength: 1, tailLength: 1 },
    parts: [
      { name: 'main chassis', shape: 'plate', position: [0, 0.62, 0], size: [0.78, 0.82, 0.44], role: 'base', priority: 'primary' },
      { name: 'upper sensor block', shape: 'plate', position: [0, 1.16, -0.02], size: [0.62, 0.34, 0.38], role: 'dark' },
      { name: 'display glass', shape: 'plate', position: [0, 0.78, -0.25], size: [0.42, 0.23, 0.025], role: 'glow' },
      { name: 'left prong', shape: 'rod', position: [-0.22, 1.48, -0.02], size: [0.09, 0.44, 0.09], rotation: [0, 0, -0.08], role: 'metal' },
      { name: 'right prong', shape: 'rod', position: [0.22, 1.48, -0.02], size: [0.09, 0.44, 0.09], rotation: [0, 0, 0.08], role: 'metal' },
      { name: 'hand grip', shape: 'box', position: [0, 0.22, 0.10], size: [0.26, 0.28, 0.22], role: 'dark', priority: 'secondary' },
      { name: 'status ring', shape: 'ring', position: [0, 1.02, -0.28], size: [0.16, 0.16, 0.05], role: 'glow' }
    ]
  };
  const result = createModel({ prompt, type: 'prop', blueprint, triangleBudget: 500 });
  assert.equal(result.group.userData.aiAuthoredGeometry, true);
  assert.ok(result.stats.parts >= 7);
  assert.ok(result.stats.triangles <= 500);
});

test('poor local-AI geometry plans safely fall back to curated procedural grammar', () => {
  const result = createModel({ prompt: 'a one-off strange artifact', type: 'prop', blueprint: { parts: [{ name: 'only one', shape: 'box' }] }, triangleBudget: 500 });
  assert.equal(result.group.userData.aiAuthoredGeometry, false);
  assert.ok(result.stats.parts >= 5);
  assert.ok(result.stats.triangles <= 500);
});

test('hard triangle budget remains absolute even when an AI plan marks every part primary', () => {
  const parts = Array.from({ length: 26 }, (_, i) => ({
    name: `central module ${i + 1}`, shape: 'plate',
    position: [((i % 5) - 2) * 0.22, 0.4 + Math.floor(i / 5) * 0.23, ((i % 3) - 1) * 0.18],
    size: [0.62, 0.58, 0.42], role: i % 4 === 0 ? 'accent' : 'base', priority: 'primary'
  }));
  const result = createModel({ prompt: 'an unfamiliar modular orbital fabricator', type: 'prop', blueprint: { parts }, triangleBudget: 180 });
  assert.ok(result.stats.triangles <= 180, `hard cap violated: ${result.stats.triangles}`);
});
