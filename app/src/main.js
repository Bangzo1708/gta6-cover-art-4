// Wires the editor: photos in, layout and grade picked, caption typed,
// panels dragged and zoomed, cover exported as a PNG. A `?shot=` query
// sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCover, SIZES } from './cover.js';
import { GRADES } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');
const layoutPicker = document.getElementById('layout-picker');
const gradePicker = document.getElementById('grade-picker');
const sizePicker = document.getElementById('size-picker');
const MAX_PANELS = 9;

/** The editor state: photos are Image elements, the rest is plain data. */
const state = {
  photos: [null, null, null, null],
  panelPhotos: Array.from({ length: MAX_PANELS }, (_, i) => i % 2),
  panelCrops: Array.from({ length: MAX_PANELS }, () => ({ dx: 0, dy: 0, zoom: 1 })),
  layoutId: 'tilted-snaps',
  gradeId: 'neon-night',
  caption: 'Neon Coast',
  subtitle: 'a sunset heist story',
  sizeId: 'wide',
  grain: true,
};
let selectedPanel = 0;

/** Undo history: plain snapshots of everything but the photos. */
const undoStack = [];
const redoStack = [];
function snapshot() {
  return JSON.stringify({
    panelPhotos: state.panelPhotos,
    panelCrops: state.panelCrops,
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    caption: state.caption,
    subtitle: state.subtitle,
  });
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}
function restore(json) {
  const s = JSON.parse(json);
  state.panelPhotos = s.panelPhotos;
  state.panelCrops = s.panelCrops;
  state.layoutId = s.layoutId;
  state.gradeId = s.gradeId;
  state.caption = s.caption;
  state.subtitle = s.subtitle;
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  syncPickers();
  redraw();
}
function syncUndoButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}

function redraw() {
  drawCover(canvas, state);
  const layout = layoutById(state.layoutId);
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${layout.panels.length} — drag the photo to move it, scroll to zoom.`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function syncPickers() {
  for (const btn of layoutPicker.children) btn.classList.toggle('on', btn.dataset.id === state.layoutId);
  for (const btn of gradePicker.children) btn.classList.toggle('on', btn.dataset.id === state.gradeId);
  for (const btn of sizePicker.children) btn.classList.toggle('on', btn.dataset.id === state.sizeId);
}

function buildPickers() {
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = layout.id;
    btn.textContent = layout.name;
    btn.title = layout.blurb;
    btn.addEventListener('click', () => {
      if (state.layoutId === layout.id) return;
      pushUndo();
      state.layoutId = layout.id;
      selectedPanel = 0;
      syncPickers();
      redraw();
    });
    layoutPicker.appendChild(btn);
  }
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = grade.id;
    btn.textContent = grade.name;
    btn.title = grade.blurb;
    btn.addEventListener('click', () => {
      if (state.gradeId === grade.id) return;
      pushUndo();
      state.gradeId = grade.id;
      syncPickers();
      redraw();
    });
    gradePicker.appendChild(btn);
  }
  for (const size of SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = size.id;
    btn.textContent = size.name;
    btn.addEventListener('click', () => {
      state.sizeId = size.id;
      syncPickers();
    });
    sizePicker.appendChild(btn);
  }
  syncPickers();
  syncUndoButtons();
}

// Photo slots: four file inputs, one per slot; a slot's photo fills the
// panels assigned to it, and the panel's photo button cycles the slot.
const slotInputs = [...document.querySelectorAll('input[data-slot]')];
slotInputs.forEach((input, slot) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    state.photos[slot] = await loadImage(URL.createObjectURL(file));
    document.getElementById(`slot-${slot + 1}-name`).textContent = file.name;
    redraw();
  });
});
document.getElementById('panel-photo').addEventListener('click', () => {
  pushUndo();
  const used = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  if (used.length === 0) return;
  const cur = state.panelPhotos[selectedPanel];
  const next = used[(used.indexOf(cur) + 1) % used.length];
  state.panelPhotos[selectedPanel] = next;
  redraw();
});
document.getElementById('panel-reset').addEventListener('click', () => {
  pushUndo();
  state.panelCrops[selectedPanel] = { dx: 0, dy: 0, zoom: 1 };
  redraw();
});

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
captionInput.addEventListener('change', pushUndo);
subtitleInput.addEventListener('change', pushUndo);

document.getElementById('undo').addEventListener('click', () => {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncUndoButtons();
});
document.getElementById('redo').addEventListener('click', () => {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncUndoButtons();
});

// Drag a panel's photo to move it, scroll to zoom it; click selects.
let dragging = null;
function coverPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
function panelAt(x, y) {
  const layout = layoutById(state.layoutId);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (x >= p.x * canvas.width && x <= (p.x + p.w) * canvas.width
      && y >= p.y * canvas.height && y <= (p.y + p.h) * canvas.height) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const pt = coverPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  selectedPanel = i;
  dragging = { panel: i, x: pt.x, y: pt.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const pt = coverPoint(e);
  const layout = layoutById(state.layoutId);
  const p = layout.panels[dragging.panel];
  const crop = state.panelCrops[dragging.panel];
  crop.dx += (pt.x - dragging.x) / (p.w * canvas.width);
  crop.dy += (pt.y - dragging.y) / (p.h * canvas.height);
  crop.dx = Math.max(-0.6, Math.min(0.6, crop.dx));
  crop.dy = Math.max(-0.6, Math.min(0.6, crop.dy));
  dragging.x = pt.x;
  dragging.y = pt.y;
  dragging.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging?.moved) pushUndo();
  dragging = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const pt = coverPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  selectedPanel = i;
  const crop = state.panelCrops[i];
  crop.zoom = Math.max(1, Math.min(3, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// Export the cover at the picked post size as a PNG download.
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES.find((s) => s.id === state.sizeId) ?? SIZES[0];
  const out = renderCover(state, size);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved neon-coast-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

buildPickers();

// The app opens with the two sample photos already loaded, so the first
// thing a person sees is a finished cover, not an empty frame.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
Promise.all([loadImage('samples/boulevard.jpg'), loadImage('samples/pier.jpg')])
  .then(([boulevard, pier]) => {
    state.photos[0] = boulevard;
    state.photos[1] = pier;
    document.getElementById('slot-1-name').textContent = 'boulevard.jpg (sample)';
    document.getElementById('slot-2-name').textContent = 'pier.jpg (sample)';
    if (shot) {
      runShot(shot, params, state, { redraw, loadImage, syncPickers });
    } else {
      redraw();
    }
  })
  .catch(() => {
    statusEl.textContent = 'Could not load the sample photos.';
    redraw();
  });
