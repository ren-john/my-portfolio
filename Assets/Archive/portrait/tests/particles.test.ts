import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPortraitParticles, portraitMask } from '../src/scene/portraitParticles.ts';

function fixture() {
  const width = 80, height = 100;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 10; y < height; y++) for (let x = 15; x < 65; x++) {
    const i = (y * width + x) * 4;
    data[i] = 70; data[i + 1] = 90; data[i + 2] = 80;
    // An enclosed white shirt touching the bottom, not the background.
    if (y > 70 && x > 30 && x < 50) data[i] = data[i + 1] = data[i + 2] = 250;
  }
  return { width, height, data };
}
const face = { count: 3, imageWidth: 80, imageHeight: 100,
  points: [[.3, .3, 0], [.7, .3, 0], [.5, .6, -.1]] as [number, number, number][],
  triangles: [[0, 1, 2]] as [number, number, number][] };

test('mask removes only connected background and preserves a white shirt', () => {
  const image = fixture(); const mask = portraitMask(image);
  assert.equal(mask[0], 0);
  assert.equal(mask[40 * 80 + 40], 255);
  assert.equal(mask[90 * 80 + 40], 255);
  assert.equal(mask[99 * 80 + 40], 255);
  assert.equal(mask[50 * 80 + 2], 0);
});
test('photo-driven particles preserve shape, tone, finite depth, and deterministic sampling', () => {
  const image = fixture(); const original = image.data.slice();
  const a = buildPortraitParticles(image, face);
  const b = buildPortraitParticles(image, face);
  assert.ok(a.count > 1000);
  assert.deepEqual(a.positions, b.positions);
  assert.deepEqual(image.data, original, 'Sampling must not alter source pixels');
  assert.equal(a.positions.length, a.count * 3);
  assert.equal(a.seeds.length, a.count * 3);
  assert.ok(a.positions.every(Number.isFinite));
  assert.ok(a.tones.every(v => v >= 0 && v <= 1));
  assert.equal(a.rgba[3], 0);
  assert.ok(a.rgba[(80 * 80 + 40) * 4 + 3] > 0);
  for (let i = 0; i < a.count; i++) {
    assert.ok(a.positions[i * 3] > -.3 && a.positions[i * 3] < .3);
  }
});
