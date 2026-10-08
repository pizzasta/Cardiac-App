// Renders src/logic/sfx/recipes.ts (interface sounds) and
// src/logic/soundscape/recipes.ts (nature soundscapes) to assets/sounds for
// iOS/Android.
// Run `npm run gen:sounds` after editing the recipes; CI fails on drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const RATE = 22050;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SFX_IDS, renderSfx, encodeWav } = await loadTs(path.join(root, 'src/logic/sfx/recipes.ts'));
const { LAYER_IDS, renderLayer } = await loadTs(path.join(root, 'src/logic/soundscape/recipes.ts'));

const dir = path.join(root, 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
const write = (name, samples) => {
  fs.writeFileSync(path.join(dir, `${name}.wav`), encodeWav(samples, RATE));
  console.log(`wrote assets/sounds/${name}.wav`);
};
for (const id of SFX_IDS) write(id, renderSfx(id, RATE));
fs.mkdirSync(path.join(dir, 'scape'), { recursive: true });
for (const id of LAYER_IDS) write(`scape/${id}`, renderLayer(id, RATE));
