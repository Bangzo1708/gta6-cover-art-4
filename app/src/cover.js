// The cover engine: draws a multi-panel GTA-style poster cover onto a
// canvas from the editor state. Everything it draws is original: panel
// geometry from layouts.js, colour from grades.js, lettering in system
// fonts. No Rockstar logo, artwork or font anywhere.

import { gradeById } from './grades.js';
import { layoutById } from './layouts.js';

/** The post sizes the editor exports, in the order the picker shows them. */
export const SIZES = [
  { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** A tiny deterministic PRNG (mulberry32) so grain looks the same every run. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a panel rect, cover-fit, with the panel's crop. */
export function drawPanelPhoto(ctx, photo, rect, crop) {
  if (!photo) return;
  const zoom = crop?.zoom ?? 1;
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  // Clamp the pan so the photo always covers the whole panel: a shift
  // further than the overhang would expose the backdrop behind it.
  const maxDx = Math.max(0, (pw - rect.w) / 2);
  const maxDy = Math.max(0, (ph - rect.h) / 2);
  const dx = Math.max(-maxDx, Math.min(maxDx, (crop?.dx ?? 0) * rect.w));
  const dy = Math.max(-maxDy, Math.min(maxDy, (crop?.dy ?? 0) * rect.h));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, rect.x + (rect.w - pw) / 2 + dx, rect.y + (rect.h - ph) / 2 + dy, pw, ph);
  ctx.restore();
}

/** Washes the whole cover with the grade's sunset or neon light. */
export function applyGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  for (const stop of grade.wash) wash.addColorStop(stop.at, stop.color);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.shadow;
  ctx.fillRect(0, 0, w, h * 0.5);
  const lift = ctx.createLinearGradient(0, h * 0.5, 0, h);
  lift.addColorStop(0, 'rgba(0,0,0,0)');
  lift.addColorStop(1, grade.highlight);
  ctx.fillStyle = lift;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);
}

/** Scatters deterministic film grain over the cover. */
export function drawGrain(ctx, w, h, seed, amount) {
  const rand = seededRandom(seed);
  const count = Math.floor((w * h) / 900);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const light = rand() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
  void amount;
}

/** Darkens the cover's corners so the panels sit in a frame of dusk. */
export function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,0,20,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Draws the halftone dot field behind a title block. */
export function drawHalftone(ctx, x, y, w, h, color, seed) {
  const rand = seededRandom(seed);
  const step = Math.max(10, Math.round(w / 90));
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = step * 0.16 * (0.5 + rand());
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draws the caption as big poster lettering: a sunset gradient fill, a
 * dark outline and a hard offset shadow, with a neon script subtitle
 * and a three-star heat meter under it.
 */
export function drawTitleBlock(ctx, layout, grade, caption, subtitle, w, h) {
  const t = layout.title;
  const bx = t.x * w;
  const by = t.y * h;
  const bw = t.w * w;
  const bh = t.h * h;
  const text = (caption || 'NEON COAST').trim().toUpperCase() || 'NEON COAST';
  let size = t.size * h;
  const family = `'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.02)}px`;
  ctx.font = `900 ${size}px ${family}`;
  while (ctx.measureText(text).width > bw * 0.98 && size > 16) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.02)}px`;
  }
  // Reserve the heat meter's width at the title's right, then shrink the
  // title again if it would run into the stars.
  const starR0 = Math.max(8, size * 0.13);
  const reserved = starR0 * 2 * 2.6 + starR0 * 2 + size * 0.3;
  while (ctx.measureText(text).width > bw * 0.98 - reserved && size > 16) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.02)}px`;
  }
  const tx = t.align === 'center' ? bx + bw / 2 : bx;
  const ty = by + bh * 0.62;
  ctx.textAlign = t.align;
  // Hard offset shadow, then the gradient face, then the dark outline.
  ctx.fillStyle = 'rgba(10, 0, 25, 0.85)';
  ctx.fillText(text, tx + size * 0.06, ty + size * 0.06);
  const face = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.18);
  face.addColorStop(0, grade.titleTop);
  face.addColorStop(1, grade.titleBottom);
  ctx.fillStyle = face;
  ctx.fillText(text, tx, ty);
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeStyle = grade.titleStroke;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, tx, ty);
  // Neon script subtitle, in white so it reads on any grade.
  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(14, size * 0.30);
    ctx.font = `italic 700 ${subSize}px 'Segoe Script', 'Brush Script MT', cursive`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(sub, tx, ty + subSize * 1.5);
    ctx.shadowBlur = 0;
  }
  // Three-star heat meter, right of the title at the title's own height,
  // clear of the subtitle below it.
  const starR = Math.max(8, size * 0.13);
  const gap = starR * 2.6;
  const totalW = gap * 2 + starR * 2;
  let sx = bx + bw - totalW;
  const sy = ty - size * 0.35;
  for (let i = 0; i < 3; i++) {
    drawStar(ctx, sx + starR, sy, starR, grade.accent);
    sx += gap;
  }
  ctx.restore();
}

/** Draws one five-point star centred at (cx, cy) with outer radius r. */
export function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draws the diagonal sunset band of the banded layouts. */
export function drawBand(ctx, w, h, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.lineTo(w, h * 0.44);
  ctx.lineTo(w, h * 0.70);
  ctx.lineTo(0, h * 0.78);
  ctx.closePath();
  ctx.clip();
  const g = ctx.createLinearGradient(0, h * 0.44, w, h * 0.70);
  g.addColorStop(0, grade.accent);
  g.addColorStop(0.55, grade.titleBottom);
  g.addColorStop(1, grade.titleTop);
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.4, w, h * 0.4);
  drawHalftone(ctx, 0, h * 0.44, w, h * 0.34, 'rgba(0,0,0,0.16)', 77);
  ctx.restore();
}

/**
 * Draws the whole cover for `state` onto `canvas` at its own size.
 * state: { photos, panelPhotos, panelCrops, layoutId, gradeId, caption,
 *   subtitle, grain } — photos are HTMLImageElements (or null).
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  const gap = layout.gap * Math.min(w, h);

  // Backdrop: deep dusk, or a sunset field for the snapshot layout.
  if (layout.field) {
    const field = ctx.createLinearGradient(0, 0, w, h);
    field.addColorStop(0, '#2b0a4a');
    field.addColorStop(0.5, '#b81e6e');
    field.addColorStop(1, '#ff7a2f');
    ctx.fillStyle = field;
    ctx.fillRect(0, 0, w, h);
    drawHalftone(ctx, 0, 0, w, h, 'rgba(255,255,255,0.07)', 31);
  } else {
    ctx.fillStyle = '#160a24';
    ctx.fillRect(0, 0, w, h);
  }

  // Panels, each photo cover-fit inside its rect, with a white frame.
  layout.panels.forEach((p, i) => {
    const rect = { x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h };
    const photo = state.photos[state.panelPhotos?.[i] ?? 0] ?? null;
    const crop = state.panelCrops?.[i];
    ctx.save();
    if (p.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(p.tilt);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      rect.x = 0;
      rect.y = 0;
    }
    if (layout.frame) {
      ctx.fillStyle = layout.frame;
      ctx.fillRect(rect.x - gap, rect.y - gap, rect.w + gap * 2, rect.h + gap * 2);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = gap * 4;
      ctx.shadowOffsetY = gap * 2;
    }
    if (photo) drawPanelPhoto(ctx, photo, rect, crop);
    else {
      ctx.fillStyle = '#241533';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  });

  if (layout.band) drawBand(ctx, w, h, grade);
  applyGrade(ctx, w, h, grade);
  // A faint halftone strip behind the title on framed grid layouts.
  if (layout.frame && !layout.field && !layout.band) {
    drawHalftone(ctx, layout.title.x * w, layout.title.y * h, layout.title.w * w, layout.title.h * h, 'rgba(255,255,255,0.05)', 55);
  }
  drawTitleBlock(ctx, layout, grade, state.caption, state.subtitle, w, h);
  drawVignette(ctx, w, h);
  if (state.grain !== false) drawGrain(ctx, w, h, 20261119, 1);
}

/** Renders a fresh canvas of the cover at `size` for export or shots. */
export function renderCover(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}
