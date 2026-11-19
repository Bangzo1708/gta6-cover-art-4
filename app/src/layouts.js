// Cover layouts: each one maps a cover of width W and height H to its
// panels (rectangles the photos fill) and its title block (where the
// caption sits). Coordinates are fractions of W and H, so one layout
// serves every post size. `tilt` rotates a panel a few degrees, in the
// snapshot style.

/** Every layout the editor offers, in the order the picker shows them. */
export const LAYOUTS = [
  {
    id: 'vice-grid',
    name: 'Vice Grid',
    blurb: 'Nine-panel poster grid with a title band across the foot.',
    panels: [
      { x: 0.02, y: 0.02, w: 0.313, h: 0.28 },
      { x: 0.343, y: 0.02, w: 0.313, h: 0.28 },
      { x: 0.667, y: 0.02, w: 0.313, h: 0.28 },
      { x: 0.02, y: 0.315, w: 0.313, h: 0.28 },
      { x: 0.343, y: 0.315, w: 0.313, h: 0.28 },
      { x: 0.667, y: 0.315, w: 0.313, h: 0.28 },
      { x: 0.02, y: 0.61, w: 0.313, h: 0.185 },
      { x: 0.343, y: 0.61, w: 0.313, h: 0.185 },
      { x: 0.667, y: 0.61, w: 0.313, h: 0.185 },
    ],
    title: { x: 0.02, y: 0.80, w: 0.96, h: 0.18, align: 'left', size: 0.115 },
    frame: '#fff7e0',
    gap: 0.008,
  },
  {
    id: 'hero-three',
    name: 'Hero + Three',
    blurb: 'One big hero panel with three stacked moments beside it.',
    panels: [
      { x: 0.02, y: 0.02, w: 0.60, h: 0.76 },
      { x: 0.64, y: 0.02, w: 0.34, h: 0.24 },
      { x: 0.64, y: 0.28, w: 0.34, h: 0.24 },
      { x: 0.64, y: 0.54, w: 0.34, h: 0.24 },
    ],
    title: { x: 0.02, y: 0.80, w: 0.96, h: 0.18, align: 'left', size: 0.115 },
    frame: '#fff7e0',
    gap: 0.008,
  },
  {
    id: 'four-panel',
    name: 'Four Panel',
    blurb: 'Classic 2 x 2 poster grid with a white frame.',
    panels: [
      { x: 0.03, y: 0.03, w: 0.455, h: 0.36 },
      { x: 0.515, y: 0.03, w: 0.455, h: 0.36 },
      { x: 0.03, y: 0.41, w: 0.455, h: 0.36 },
      { x: 0.515, y: 0.41, w: 0.455, h: 0.36 },
    ],
    title: { x: 0.03, y: 0.795, w: 0.94, h: 0.175, align: 'center', size: 0.11 },
    frame: '#fff7e0',
    gap: 0.01,
  },
  {
    id: 'full-bleed',
    name: 'Sunset Sleeve',
    blurb: 'One photo full bleed under a diagonal sunset band.',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0 }],
    title: { x: 0.04, y: 0.46, w: 0.92, h: 0.26, align: 'left', size: 0.13 },
    frame: null,
    gap: 0,
    band: true,
  },
  {
    id: 'tilted-snaps',
    name: 'Tilted Vice',
    blurb: 'Three tilted snapshots scattered over a sunset field.',
    panels: [
      { x: 0.05, y: 0.05, w: 0.42, h: 0.52, tilt: -0.06 },
      { x: 0.52, y: 0.10, w: 0.42, h: 0.52, tilt: 0.05 },
      { x: 0.28, y: 0.42, w: 0.44, h: 0.38, tilt: -0.02 },
    ],
    title: { x: 0.04, y: 0.82, w: 0.92, h: 0.16, align: 'center', size: 0.11 },
    frame: '#fff7e0',
    gap: 0.008,
    field: true,
  },
  {
    id: 'diagonal-band',
    name: 'Diagonal Band',
    blurb: 'Big photo on top, a title band, a strip of three below.',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.52 },
      { x: 0.02, y: 0.70, w: 0.313, h: 0.26 },
      { x: 0.343, y: 0.70, w: 0.313, h: 0.26 },
      { x: 0.667, y: 0.70, w: 0.313, h: 0.26 },
    ],
    title: { x: 0.02, y: 0.53, w: 0.96, h: 0.16, align: 'left', size: 0.105 },
    frame: '#fff7e0',
    gap: 0.008,
    band: true,
  },
];

/** Looks a layout up by id, falling back to the first layout. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}
