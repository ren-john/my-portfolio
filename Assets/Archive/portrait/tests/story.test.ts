import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStory } from '../src/story/evaluateStory.ts';
import { readFileSync } from 'node:fs';

test('centered photo and name give way to a particle heading and readable HTML', () => {
  assert.equal(evaluateStory(0).portraitOpacity, 1);
  assert.equal(evaluateStory(0).pointOpacity, 0);
  assert.equal(evaluateStory(0).nameOpacity, 1);
  assert.equal(evaluateStory(0).headingOpacity, 0);
  assert.equal(evaluateStory(.3).portraitOpacity, 0);
  assert.equal(evaluateStory(.3).nameOpacity, 0);
  assert.equal(evaluateStory(.83).formation, 1);
  assert.equal(evaluateStory(.83).pointOpacity, 1);
  assert.equal(evaluateStory(.83).headingOpacity, 0);
  assert.equal(evaluateStory(1).headingOpacity, 1);
  assert.equal(evaluateStory(1).pointOpacity, 0);
});
test('particles disperse and gather without any head rotation', () => {
  assert.ok(evaluateStory(.43).scatter > .99);
  assert.ok(evaluateStory(.82).scatter < .00001);
  assert.ok(evaluateStory(1).scatter < .00001);
  for (let i = 0; i <= 1000; i++) {
    const state = evaluateStory(i / 1000);
    assert.ok(state.scatter >= 0 && state.scatter <= 1);
    assert.equal(state.yaw, 0);
  }
});
test('story is reversible, bounded, and continuous across all beats', () => {
  const forward = Array.from({ length: 1001 }, (_, i) => evaluateStory(i / 1000));
  for (let i = 1000; i >= 0; i--) {
    assert.deepEqual(evaluateStory(i / 1000), forward[i]);
    assert.ok(forward[i].portraitOpacity >= 0 && forward[i].portraitOpacity <= 1);
    if (i) assert.ok(Math.abs(forward[i].yaw - forward[i - 1].yaw) < .015);
  }
  assert.deepEqual(evaluateStory(-1), forward[0]);
  assert.deepEqual(evaluateStory(2), forward[1000]);
});
test('letter formation is monotonic and the handoff never removes both layers', () => {
  let last = 0;
  for (let i = 0; i <= 1000; i++) {
    const state = evaluateStory(i / 1000);
    assert.ok(state.formation >= last);
    last = state.formation;
    if (i > 820) assert.ok(state.pointOpacity + state.headingOpacity >= .95);
  }
});
test('personalized export has 478 finite landmarks and valid topology', () => {
  const data = JSON.parse(readFileSync(new URL('../public/data/face-landmarks.json', import.meta.url), 'utf8'));
  assert.equal(data.source, 'myPic.jpg');
  assert.equal(data.count, 478);
  assert.equal(data.points.length, 478);
  assert.equal(data.sourceSha256.length, 64);
  for (const p of data.points) assert.ok(p.length === 3 && p.every(Number.isFinite));
  for (const indices of [...data.edges, ...data.contours, ...data.triangles]) {
    assert.ok(indices.every((i: number) => Number.isInteger(i) && i >= 0 && i < 478));
  }
  assert.ok(data.edges.length > 1000);
  assert.ok(Math.max(...data.points.map((p: number[]) => p[2])) - Math.min(...data.points.map((p: number[]) => p[2])) > .05);
});
