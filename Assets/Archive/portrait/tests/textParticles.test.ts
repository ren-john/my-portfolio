import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTextTargets } from '../src/scene/textParticles.ts';

test('every portrait particle receives a deterministic, finite target inside the text mask', () => {
  const width = 100, height = 60, pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 10; y < 40; y++) for (let x = 10; x < 50; x++) pixels[(y * width + x) * 4 + 3] = 255;
  const a = sampleTextTargets(pixels, width, height, 39080, 1000, 600);
  assert.equal(a.length, 39080 * 3);
  assert.ok(a.every(Number.isFinite));
  assert.deepEqual(a, sampleTextTargets(pixels, width, height, 39080, 1000, 600));
  for (let i = 0; i < a.length; i += 3) {
    const x = (a[i] / (4.4 * 1000 / 600) + .5) * width;
    const y = (.5 - a[i + 1] / 4.4) * height;
    assert.ok(x >= 9 && x <= 50 && y >= 9 && y <= 40);
    assert.equal(a[i + 2], 0);
  }
});
test('empty text fails explicitly instead of rendering an empty transition', () => {
  assert.throws(() => sampleTextTargets(new Uint8ClampedArray(400), 10, 10, 10, 100, 100), /could not be sampled/);
});
