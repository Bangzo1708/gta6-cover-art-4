// A gta6-cover-art-01 entry (Node 22, standard library only): the app is
// this directory's app/ folder — Neon Coast Cover Studio, an offline
// multi-panel GTA-style cover maker with six layouts, five sunset grades
// and PNG export in the common post sizes — and the program hands it in.
// It copies app/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json with the vendored make.fun library.
//
// IMPORTANT: the program never removes the output directory itself. The
// grader runs it as an unprivileged user with /output as a mount point,
// so deleting that directory fails with EPERM and the entry is rejected.
// It only clears the three things it writes inside it — app/,
// screenshots/ and dossier.json — so a second run writes the same bytes.
//
// Serve the app locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear only what this program writes inside the output directory: the
// app/ and screenshots/ trees and dossier.json. Never the directory
// itself — it may be a mount point the runner cannot remove.
mkdirSync(out, { recursive: true });
for (const name of ['app', 'screenshots', 'dossier.json']) {
  const target = join(out, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
// of app files, in all, or a path under app/ over 1000 bytes: app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// One line on stdout so a run's result is visible without reading the
// output directory: the dossier's byte size, which must be identical on
// every run of the same repository.
console.log(`neon-coast-cover-studio: wrote ${dossier.length} bytes to ${join(out, 'dossier.json')}`);
