/** Deterministically distribute the portrait's particles over a sampled heading. */
export function sampleTextTargets(alpha: Uint8ClampedArray, width: number, height: number, count: number, stageWidth: number, stageHeight: number) {
  const samples: number[] = [];
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    if (alpha[(y * width + x) * 4 + 3] > 110) samples.push(x, y);
  }
  if (samples.length < 2) throw new Error('Heading could not be sampled');
  const total = samples.length / 2;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // A modular scramble spreads nearby portrait particles across different letters.
    const j = ((i * 7919) % total) * 2;
    const jitter = ((i * 13) % 7 - 3) * .11;
    positions[i * 3] = ((samples[j] + jitter) / width - .5) * (4.4 * stageWidth / stageHeight);
    positions[i * 3 + 1] = (.5 - (samples[j + 1] + jitter) / height) * 4.4;
  }
  return positions;
}

/** Use the existing DOM typography, including its font family and italic spans. */
export function headingTargets(heading: HTMLElement, stage: HTMLElement, count: number) {
  const bounds = stage.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bounds.width));
  canvas.height = Math.max(1, Math.round(bounds.height));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Heading sampling is unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  heading.querySelectorAll<HTMLElement>('[data-particle-line]').forEach(line => {
    const rect = line.getBoundingClientRect();
    const style = getComputedStyle(line);
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    const text = line.textContent ?? '';
    const metrics = ctx.measureText(text);
    const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .8;
    const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * .2;
    const baseline = rect.top - bounds.top + (rect.height - ascent - descent) / 2 + ascent;
    ctx.fillText(text, rect.left - bounds.left, baseline);
  });
  return sampleTextTargets(ctx.getImageData(0, 0, canvas.width, canvas.height).data,
    canvas.width, canvas.height, count, bounds.width, bounds.height);
}
