export const destinations = ['about', 'projects', 'skills', 'education', 'contact'] as const;
export type Page = 'home' | typeof destinations[number];
export function resolvePage(hash: string): Page {
  const value = hash.replace(/^#\/?/, '');
  if (value === 'babycue' || value === 'inventory') return 'projects';
  if (value === 'intro') return 'about';
  return value === 'home' || destinations.includes(value as typeof destinations[number]) ? value as Page : 'home';
}
export function clusterCenters(width: number, height: number) {
  const normalized = width < 650
    ? [[.24,.16],[.76,.18],[.24,.47],[.76,.49],[.5,.82]]
    : [[.26,.29],[.51,.22],[.76,.40],[.33,.71],[.65,.76]];
  return normalized.map(([x,y], i) => [(x-.5)*10*width/height, (.5-y)*10, [0,.4,-.2,.3,-.1][i]]);
}
export function seededRandom(seed: number) {
  return () => { seed = Math.imul(seed ^ seed >>> 15, 1 | seed); seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed); return ((seed ^ seed >>> 14) >>> 0) / 4294967296; };
}
