/** Photo sampling and depth construction are CPU preparation, performed once. */
export type FaceData = {
  count: number; imageWidth: number; imageHeight: number;
  points: [number, number, number][];
  triangles: [number, number, number][];
};
export type Raster = { width: number; height: number; data: Uint8Array | Uint8ClampedArray };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Flood only border-connected white background; preserve the white shirt. */
export function portraitMask(image: Raster): Uint8Array {
  const { width: w, height: h, data } = image;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  function enqueue(i: number) {
    if (i < 0 || i >= w * h || visited[i]) return;
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    if (Math.min(r, g, b) < 218 || Math.max(r, g, b) - Math.min(r, g, b) > 33) return;
    visited[i] = 1;
    queue[tail++] = i;
  }
  for (let x = 0; x < w; x++) enqueue(x);
  for (let y = 0; y < h * .72; y++) { enqueue(y * w); enqueue(y * w + w - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % w;
    if (x > 0) enqueue(i - 1);
    if (x < w - 1) enqueue(i + 1);
    enqueue(i - w); enqueue(i + w);
  }
  return Uint8Array.from(visited, (background, i) => background || data[i * 4 + 3] < 10 ? 0 : 255);
}

export function buildPortraitParticles(image: Raster, face: FaceData, step = 1.8) {
  const { width: w, height: h, data } = image;
  if (w < 2 || h < 2 || data.length !== w * h * 4 || step < 1) throw new Error('Invalid portrait raster');
  const mask = portraitMask(image);
  const ratio = w / h;
  const depth = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = y / h, u = x / w;
    const radius = v > .68 ? .56 : .34;
    depth[y * w + x] = (.065 * Math.sqrt(Math.max(0, 1 - ((u - .52) / radius) ** 2)) - .025) * ratio;
  }
  // Rasterize actual landmark depth into the photograph's coordinates.
  for (const indices of face.triangles) {
    const [a, b, c] = indices.map(i => face.points[i]);
    const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(det) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]) * w));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0]) * w));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]) * h));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1]) * h));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const u = x / w, v = y / h;
      const wa = ((b[1] - c[1]) * (u - c[0]) + (c[0] - b[0]) * (v - c[1])) / det;
      const wb = ((c[1] - a[1]) * (u - c[0]) + (a[0] - c[0]) * (v - c[1])) / det;
      const wc = 1 - wa - wb;
      if (wa >= 0 && wb >= 0 && wc >= 0) depth[y * w + x] = (.035 - (wa * a[2] + wb * b[2] + wc * c[2])) * ratio;
    }
  }
  const positions: number[] = [], tones: number[] = [], seeds: number[] = [], sizes: number[] = [];
  let index = 0;
  for (let y = step / 2; y < h - 1; y += step) for (let x = step / 2; x < w - 1; x += step) {
    const px = Math.min(w - 1, Math.max(0, Math.round(x + (hash(index + 1) - .5) * step * .8)));
    const py = Math.min(h - 1, Math.max(0, Math.round(y + (hash(index + 8) - .5) * step * .8)));
    const i = py * w + px;
    index++;
    if (!mask[i]) continue;
    const luminance = (data[i * 4] * .2126 + data[i * 4 + 1] * .7152 + data[i * 4 + 2] * .0722) / 255;
    const sideFade = clamp(Math.min(px, w - 1 - px) / (w * .055));
    const bottomFade = clamp((1 - py / h) / .12);
    const tone = (.055 + .945 * Math.pow(luminance, 1.35)) * sideFade * bottomFade;
    if (tone < .008) continue;
    positions.push((px / w - .5) * ratio, .5 - py / h, depth[i]);
    tones.push(tone);
    seeds.push(hash(index + 53), hash(index + 107), hash(index + 251));
    sizes.push(.6 + hash(index + 41) * 1.25);
  }
  // Same silhouette and fade for the photograph and particles.
  const rgba = new Uint8Array(data);
  for (let i = 0; i < mask.length; i++) {
    const x = i % w, y = Math.floor(i / w);
    rgba[i * 4 + 3] = mask[i] * clamp((1 - y / h) / .12) * clamp(Math.min(x, w - 1 - x) / (w * .055));
  }
  return { positions: new Float32Array(positions), tones: new Float32Array(tones),
    seeds: new Float32Array(seeds), sizes: new Float32Array(sizes), rgba, count: tones.length };
}
