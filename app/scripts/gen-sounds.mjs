// Renders src/logic/sfx/recipes.ts to assets/sounds/*.wav for iOS/Android.
// Run `npm run gen:sounds` after editing the recipes; CI fails on drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const RATE = 22050;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SFX_IDS, renderSfx, renderAmbience, encodeWav } = await loadTs(
  path.join(root, 'src/logic/sfx/recipes.ts')
);

const dir = path.join(root, 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
const write = (name, samples) => {
  fs.writeFileSync(path.join(dir, `${name}.wav`), encodeWav(samples, RATE));
  console.log(`wrote assets/sounds/${name}.wav`);
};
for (const id of SFX_IDS) write(id, renderSfx(id, RATE));
write('ambience', renderAmbience(RATE));
