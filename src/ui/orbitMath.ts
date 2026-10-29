export const TAU = Math.PI * 2;
export const FRONT_ANGLE = 2.95;
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

/** A reversible scroll timeline: full color, contraction, then a settled orbit. */
export function orbitTransition(progress: number, width: number, height: number, reduced = false) {
  const radius = width <= 700 ? 52 : 78;
  const cover = Math.hypot(width / 2, height * .52) + 4;
  const contraction = reduced ? 1 : smoothstep(.06, .66, progress);
  return {
    scale: (cover + (radius - cover) * contraction) / radius,
    reveal: reduced ? 1 : smoothstep(.38, .76, progress),
    intro: reduced ? 0 : 1 - smoothstep(.07, .33, progress),
    ready: reduced || progress >= .66,
  };
}

/** Cards follow a projected ellipse, with depth-driven scale and focus. */
export function orbitPose(index: number, count: number, rotation: number, tilt: number, width: number, height: number) {
  const mobile = width <= 700;
  const angle = index * TAU / count + rotation - (mobile ? .4 : 0);
  const depth = (Math.cos(angle - FRONT_ANGLE + (mobile ? .4 : 0)) + 1) / 2;
  const x = Math.cos(angle) * width * (mobile ? .30 : .34);
  const y = Math.sin(angle) * height * (.37 + clamp(tilt, -.12, .12));
  return {
    x,
    y: y - x * .08,
    scale: .58 + depth * .44,
    opacity: .45 + depth * .55,
    blur: (1 - depth) * 2.4,
    zIndex: 2 + Math.round(depth * 10),
  };
}

export function rotationForProject(index: number, count: number, current: number) {
  const target = FRONT_ANGLE - wrapIndex(index, count) * TAU / count;
  return target + Math.round((current - target) / TAU) * TAU;
}

export function selectedProject(rotation: number, count: number) {
  return wrapIndex(Math.round((FRONT_ANGLE - rotation) / (TAU / count)), count);
}
