// Pre-rendered soundscape files for iOS/Android (see recipes.ts and
// `npm run gen:sounds`). Imported only by sound.native.ts, so the web bundle
// never includes them.
import type { LayerId } from './recipes';

export const SOUND_FILES: Record<LayerId, number> = {
  'bed-breeze': require('../../../assets/sounds/scape/bed-breeze.wav'),
  'bed-waves': require('../../../assets/sounds/scape/bed-waves.wav'),
  'bed-snowwind': require('../../../assets/sounds/scape/bed-snowwind.wav'),
  'bed-forest': require('../../../assets/sounds/scape/bed-forest.wav'),
  'bed-meadow': require('../../../assets/sounds/scape/bed-meadow.wav'),
  'bed-wheat': require('../../../assets/sounds/scape/bed-wheat.wav'),
  'critter-birds': require('../../../assets/sounds/scape/critter-birds.wav'),
  'critter-crickets': require('../../../assets/sounds/scape/critter-crickets.wav'),
  'critter-grasshoppers': require('../../../assets/sounds/scape/critter-grasshoppers.wav'),
  'call-gull': require('../../../assets/sounds/scape/call-gull.wav'),
  'call-howl': require('../../../assets/sounds/scape/call-howl.wav'),
  'call-owl': require('../../../assets/sounds/scape/call-owl.wav'),
  'call-woodpecker': require('../../../assets/sounds/scape/call-woodpecker.wav'),
  'call-frog': require('../../../assets/sounds/scape/call-frog.wav'),
  'call-drip': require('../../../assets/sounds/scape/call-drip.wav'),
};
