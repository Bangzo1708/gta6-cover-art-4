// Fixed scenes for screenshots: ?shot=cover shows one exported cover
// alone, ?shot=editor shows the editor with a photo loaded. The query
// picks the layout, grade, caption and size, so each screenshot shows a
// different cover. window.__shotReady is set once painted.
import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';
import { SIZES } from './cover.js';

function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** Sets up one fixed scene and redraws; `helpers` carries redraw/loadImage. */
export function runShot(shot, query, state, helpers) {
  const canvas = document.getElementById('cover');
  const layout = layoutById(query.get('layout') ?? state.layoutId);
  const grade = gradeById(query.get('grade') ?? state.gradeId);
  state.layoutId = layout.id;
  state.gradeId = grade.id;
  state.caption = query.get('caption') ?? state.caption;
  state.subtitle = query.get('subtitle') ?? state.subtitle;
  document.getElementById('caption').value = state.caption;
  document.getElementById('subtitle').value = state.subtitle;
  if (query.get('photos')) {
    state.panelPhotos = query.get('photos').split(',').map((n) => Number(n) || 0);
  }
  // A cover shot frames each panel differently, so nine panels of two
  // photos still read as nine moments, not nine copies.
  if (shot === 'cover' || shot === 'portrait' || shot === 'square') {
    state.panelCrops = layout.panels.map((_, i) => ({
      dx: (((i * 37) % 5) - 2) * 0.12,
      dy: (((i * 53) % 5) - 2) * 0.08,
      zoom: 1 + (i % 3) * 0.15,
    }));
  }

  if (shot === 'cover' || shot === 'portrait' || shot === 'square') {
    document.body.classList.add('shot-cover');
    const size = SIZES.find((s) => s.id === (query.get('size') ?? 'wide')) ?? SIZES[2];
    const w = Number(query.get('w') ?? size.w);
    const h = Number(query.get('h') ?? size.h);
    canvas.width = w;
    canvas.height = h;
    helpers.syncPickers();
    helpers.redraw();
    ready();
    return;
  }

  // Editor scene: the full editor with a sample photo loaded.
  helpers.syncPickers();
  helpers.redraw();
  ready();
}
