import React from 'react';
import { AnimalId } from '../data/archetypes';

// An abstract low-poly form and motion signature per rhythm animal: the
// Dolphin glides, the Hummingbird buzzes, the Bear lumbers, the Octopus
// writhes. Shared by the reveal emblem and the world's horizon totem.

export interface CreatureCfg {
  geometry: React.ReactNode;
  spin: number; // y-rotation speed
  bob: number; // vertical bob frequency
  tilt: number; // x-wobble amount
}

export function creatureFor(animal: AnimalId): CreatureCfg {
  switch (animal) {
    case 'dolphin':
      return { geometry: <torusKnotGeometry args={[0.9, 0.28, 120, 16]} />, spin: 0.5, bob: 1.1, tilt: 0.25 };
    case 'wolf':
      return { geometry: <icosahedronGeometry args={[1.25, 0]} />, spin: 0.9, bob: 0.7, tilt: 0.1 };
    case 'bear':
      return { geometry: <dodecahedronGeometry args={[1.3, 0]} />, spin: 0.25, bob: 0.6, tilt: 0.08 };
    case 'hummingbird':
      return { geometry: <octahedronGeometry args={[1.0, 0]} />, spin: 2.4, bob: 3.2, tilt: 0.3 };
    case 'fox':
      return { geometry: <coneGeometry args={[1.0, 1.9, 7]} />, spin: 1.1, bob: 0.9, tilt: 0.15 };
    case 'octopus':
      return { geometry: <torusKnotGeometry args={[0.85, 0.34, 140, 20, 2, 5]} />, spin: 0.7, bob: 1.4, tilt: 0.35 };
  }
}
