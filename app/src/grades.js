// Colour grades for the cover engine: each grade is a set of translucent
// overlays a cover draws over its photos, plus the ink used for its title.
// Every grade is original work: a Vice City neon-sunset palette, never a
// Rockstar asset.

/** Every grade the editor offers, in the order the picker shows them. */
export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    blurb: 'Magenta dusk melting into orange horizon light.',
    // A vertical wash: hot pink at the top, amber at the foot.
    wash: [
      { at: 0.0, color: 'rgba(255, 45, 149, 0.16)' },
      { at: 0.45, color: 'rgba(255, 110, 60, 0.05)' },
      { at: 1.0, color: 'rgba(255, 140, 40, 0.22)' },
    ],
    // Warm lift on the shadows, cool pinch on the highlights.
    shadow: 'rgba(40, 10, 60, 0.20)',
    highlight: 'rgba(255, 190, 90, 0.10)',
    titleTop: '#fff7e0',
    titleBottom: '#ff9a3d',
    titleStroke: '#1a0b2e',
    accent: '#ff2d95',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    blurb: 'Wet-street teal shadows against hot pink neon.',
    wash: [
      { at: 0.0, color: 'rgba(0, 229, 255, 0.14)' },
      { at: 0.5, color: 'rgba(120, 40, 200, 0.06)' },
      { at: 1.0, color: 'rgba(255, 45, 149, 0.20)' },
    ],
    shadow: 'rgba(0, 30, 45, 0.28)',
    highlight: 'rgba(0, 229, 255, 0.10)',
    titleTop: '#e8fbff',
    titleBottom: '#00e5ff',
    titleStroke: '#12002e',
    accent: '#00e5ff',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    blurb: 'Low warm sun, long soft shadows, honey highlights.',
    wash: [
      { at: 0.0, color: 'rgba(255, 214, 130, 0.10)' },
      { at: 0.6, color: 'rgba(255, 170, 60, 0.08)' },
      { at: 1.0, color: 'rgba(214, 110, 20, 0.20)' },
    ],
    shadow: 'rgba(60, 30, 0, 0.18)',
    highlight: 'rgba(255, 220, 140, 0.14)',
    titleTop: '#fffbe8',
    titleBottom: '#ffc53d',
    titleStroke: '#241300',
    accent: '#ff8a00',
  },
  {
    id: 'teal-noir',
    name: 'Teal Noir',
    blurb: 'Moody teal duotone, a single hot accent.',
    wash: [
      { at: 0.0, color: 'rgba(0, 180, 190, 0.18)' },
      { at: 0.5, color: 'rgba(10, 60, 80, 0.10)' },
      { at: 1.0, color: 'rgba(0, 40, 60, 0.26)' },
    ],
    shadow: 'rgba(0, 20, 30, 0.30)',
    highlight: 'rgba(120, 230, 230, 0.08)',
    titleTop: '#eafcff',
    titleBottom: '#4dd8d8',
    titleStroke: '#00141a',
    accent: '#ff5a3c',
  },
  {
    id: 'mono-pop',
    name: 'Mono Pop',
    blurb: 'High-contrast black and white with one hot accent.',
    wash: [
      { at: 0.0, color: 'rgba(255, 255, 255, 0.06)' },
      { at: 0.5, color: 'rgba(128, 128, 128, 0.04)' },
      { at: 1.0, color: 'rgba(0, 0, 0, 0.22)' },
    ],
    shadow: 'rgba(0, 0, 0, 0.30)',
    highlight: 'rgba(255, 255, 255, 0.12)',
    titleTop: '#ffffff',
    titleBottom: '#ffd23d',
    titleStroke: '#000000',
    accent: '#ff2d55',
  },
];

/** Looks a grade up by id, falling back to the first grade. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
