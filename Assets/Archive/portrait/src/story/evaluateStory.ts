export const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export const smooth = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Opening only: portrait -> scattered particles -> first heading -> HTML handoff. */
export function evaluateStory(value: number) {
  const progress = clamp(value);
  const formation = smooth(.39, .82, progress);
  return {
    progress,
    yaw: 0,
    morph: smooth(.025, .18, progress),
    formation,
    scatter: Math.sin(Math.PI * smooth(.10, .76, progress)) ** 2,
    portraitOpacity: 1 - smooth(.025, .19, progress),
    pointOpacity: smooth(.015, .12, progress) * (1 - smooth(.88, .99, progress)),
    nameOpacity: 1 - smooth(.06, .28, progress),
    headingOpacity: smooth(.86, .99, progress),
  };
}
export type StoryState = ReturnType<typeof evaluateStory>;
