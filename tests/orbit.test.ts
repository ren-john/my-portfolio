import test from 'node:test';
import assert from 'node:assert/strict';
import { FRONT_ANGLE, TAU, orbitPose, orbitTransition, rotationForProject, selectedProject } from '../src/ui/orbitMath.ts';

test('the purple transition covers the viewport before shrinking to the same hub', () => {
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [360, 800]]) {
    const radius = width <= 700 ? 52 : 78;
    const initial = orbitTransition(0, width, height);
    assert.ok(initial.scale * radius >= Math.hypot(width / 2, height * .52));
    assert.equal(initial.reveal, 0);
    assert.equal(initial.intro, 1);
    const end = orbitTransition(1, width, height);
    assert.ok(Math.abs(end.scale - 1) < 1e-12);
    assert.equal(end.reveal, 1);
    assert.ok(end.ready);
    let previous = initial.scale;
    for (let i = 0; i <= 100; i++) {
      const state = orbitTransition(i / 100, width, height);
      assert.ok(state.scale <= previous + 1e-12);
      assert.ok(state.reveal >= 0 && state.reveal <= 1);
      previous = state.scale;
    }
    assert.equal(orbitTransition(0, width, height, true).reveal, 1);
    assert.ok(orbitTransition(0, width, height, true).ready);
  }
});

test('orbit controls wrap in both directions and use the shortest rotation', () => {
  for (const current of [-TAU * 8, FRONT_ANGLE, TAU * 12]) {
    for (let i = -1; i <= 7; i++) {
      const target = rotationForProject(i, 7, current);
      assert.ok(Math.abs(target - current) <= Math.PI + 1e-10);
      assert.equal(selectedProject(target, 7), (i + 7) % 7);
    }
  }
});

test('every project follows a finite, periodic orbit clear of the central hub', () => {
  for (const [width, height] of [[1440, 900], [390, 844], [360, 600]]) {
    for (let angle = 0; angle < TAU; angle += .1) {
      for (let i = 0; i < 7; i++) {
        const p = orbitPose(i, 7, angle, 0, width, height);
        const repeat = orbitPose(i, 7, angle + TAU, 0, width, height);
        assert.ok(Object.values(p).every(Number.isFinite));
        assert.ok(Math.hypot(p.x, p.y) > (width <= 700 ? 100 : 150));
        assert.ok(Math.abs(p.x - repeat.x) < 1e-8 && Math.abs(p.y - repeat.y) < 1e-8);
        assert.ok(p.scale >= .58 && p.scale <= 1.02);
      }
    }
  }
});
