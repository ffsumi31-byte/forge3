import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, classifyPrompt, getMeshStats } from '../src/modeler.js';

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
