// Cute rhythm animals, built from primitives and animated in code (no
// model files): each has its own moving parts, and the whole animal reacts to
// the person's check-in mood (see moodMotion in rig.ts) and hops on a save.
//
// Animals face +x in a three-quarter view, centred on the origin, roughly
// 2.4 units long, so the same component fits the reveal emblem and the world.
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from './fiber';
import { AnimalId } from '../data/archetypes';
import { damp, hopHeight, Mood, moodMotion } from './rig';

type V3 = [number, number, number];

interface Palette {
  body: THREE.MeshStandardMaterial;
  light: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  shine: THREE.MeshBasicMaterial;
  blush: THREE.MeshBasicMaterial;
}

function usePalette(color: string): Palette {
  const pal = useMemo<Palette>(
    () => ({
      // Smooth shading with a soft satin finish, to sit naturally in the
      // realistic landscape.
      body: new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.05 }),
      light: new THREE.MeshStandardMaterial({ roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ roughness: 0.48 }),
      eye: new THREE.MeshStandardMaterial({ color: '#0b0b10', roughness: 0.2 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      blush: new THREE.MeshBasicMaterial({ color: '#ff6f9f', transparent: true, opacity: 0.6 }),
    }),
    []
  );
  useEffect(() => {
    const c = new THREE.Color(color);
    pal.body.color.copy(c);
    pal.body.emissive.copy(c).multiplyScalar(0.12);
    pal.light.color.copy(c).lerp(new THREE.Color('#ffffff'), 0.55);
    pal.dark.color.copy(c).lerp(new THREE.Color('#000000'), 0.45);
  }, [color, pal]);
  useEffect(
    () => () => Object.values(pal).forEach((m) => (m as THREE.Material).dispose()),
    [pal]
  );
  return pal;
}

// Primitive helpers.
// Shared geometries, built once and reused by every mesh. Detail is tiered
// by the `d` hint so smooth shading reads as rounded on the large parts
// without paying for it on small, repeated ones (eyes, tentacle beads).
const SPHERES = {
  low: new THREE.SphereGeometry(1, 12, 9), // d <= 6: eyes, highlights
  mid: new THREE.SphereGeometry(1, 16, 12), // d <= 10: beads, wings, small parts
  high: new THREE.SphereGeometry(1, 32, 24), // larger bodies and heads
};
const CONES = new Map<number, THREE.ConeGeometry>();
function coneGeometry(seg: number): THREE.ConeGeometry {
  const radial = Math.max(16, seg * 3);
  let g = CONES.get(radial);
  if (!g) {
    g = new THREE.ConeGeometry(1, 1, radial, 3);
    CONES.set(radial, g);
  }
  return g;
}

function Ball({ m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], d = 14 }: { m: THREE.Material; p?: V3; s?: V3; r?: V3; d?: number }) {
  const geometry = d <= 6 ? SPHERES.low : d <= 10 ? SPHERES.mid : SPHERES.high;
  return <mesh geometry={geometry} material={m} position={p} scale={s} rotation={r} />;
}
function Cone({ m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], seg = 8 }: { m: THREE.Material; p?: V3; s?: V3; r?: V3; seg?: number }) {
  return (
    <mesh geometry={coneGeometry(seg)} material={m} position={p} scale={s} rotation={r} />
  );
}
function Leg({ m, p, len = 0.5, w = 0.11 }: { m: THREE.Material; p: V3; len?: number; w?: number }) {
  return (
    <group>
      <mesh material={m} position={[p[0], p[1] - len / 2, p[2]]}>
        <cylinderGeometry args={[w, w * 0.85, len, 16]} />
      </mesh>
      {/* Rounded foot */}
      <mesh geometry={SPHERES.mid} material={m} position={[p[0], p[1] - len, p[2]]} scale={[w * 0.95, w * 0.7, w * 0.95]} />
    </group>
  );
}
// Blink state shared by every eye of the animal (1 open, ~0 closed), written
// by Animal's frame loop.
const BlinkContext = React.createContext<{ v: number }>({ v: 1 });

const SMILE = new THREE.TorusGeometry(1, 0.28, 8, 20, Math.PI);

// A big, glossy eye with two catchlights. `look` points the catchlights
// toward the viewer in the part's local space.
function Eye({ pal, p, size = 0.085, look = [0.75, 0.4, 0.45] }: { pal: Palette; p: V3; size?: number; look?: V3 }) {
  const ref = useRef<THREE.Group>(null);
  const blink = React.useContext(BlinkContext);
  useFrame(() => {
    if (ref.current) ref.current.scale.y = blink.v;
  });
  const [lx, ly, lz] = look;
  return (
    <group ref={ref} position={p}>
      <Ball m={pal.eye} s={[size, size * 1.08, size]} d={10} />
      <Ball m={pal.shine} p={[lx * size * 0.75, ly * size * 0.95, lz * size * 0.75]} s={[size * 0.34, size * 0.34, size * 0.34]} d={6} />
      <Ball m={pal.shine} p={[lx * size * 0.85, -ly * size * 0.3, lz * size * 0.85]} s={[size * 0.15, size * 0.15, size * 0.15]} d={6} />
    </group>
  );
}
// Rosy cheek, sunk into the surface so only a soft round patch shows.
function Cheek({ pal, p, size = 0.07 }: { pal: Palette; p: V3; size?: number }) {
  return <Ball m={pal.blush} p={p} s={[size, size * 0.75, size]} d={6} />;
}
// A small curved smile on a face pointing `face` radians from +x toward +z.
function Smile({ pal, p, size = 0.05, face = 0 }: { pal: Palette; p: V3; size?: number; face?: number }) {
  return (
    <mesh geometry={SMILE} material={pal.eye} position={p} scale={[size, size, size]} rotation={[0, PI / 2 - face, PI]} />
  );
}

// Per-animal rigs. Each returns its meshes and registers an `animate(t)` that
// moves its parts (t is already scaled by mood speed). Proportions are
// deliberately cute: big heads turned toward the viewer, big eyes, short legs.
type Animate = (t: number) => void;
type Rig = (pal: Palette, register: (fn: Animate) => void) => React.ReactElement;

const PI = Math.PI;
// Heads turn this far (radians) from the body toward the camera.
const FACE_VIEWER = -1.0;

const Dolphin: Rig = (pal, register) => {
  const body = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  register((t) => {
    if (body.current) {
      body.current.rotation.z = Math.sin(t * 2) * 0.12;
      body.current.position.y = Math.sin(t * 2 - 0.6) * 0.12;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2 + 1.2) * 0.45;
  });
  return (
    <group rotation={[0, -0.3, 0]}>
      <group ref={body}>
        <Ball m={pal.body} s={[0.9, 0.46, 0.42]} d={18} />
        <Ball m={pal.light} p={[0.12, -0.16, 0]} s={[0.72, 0.28, 0.32]} d={14} />
        <Ball m={pal.light} p={[0.9, -0.12, 0]} s={[0.2, 0.11, 0.12]} d={10} />
        <Cone m={pal.dark} p={[-0.08, 0.48, 0]} s={[0.15, 0.32, 0.06]} r={[0, 0, 0.5]} />
        <Ball m={pal.dark} p={[0.25, -0.34, 0.3]} s={[0.16, 0.04, 0.1]} r={[0.5, 0, -0.5]} d={8} />
        <Ball m={pal.dark} p={[0.25, -0.34, -0.3]} s={[0.16, 0.04, 0.1]} r={[-0.5, 0, -0.5]} d={8} />
        <Eye pal={pal} p={[0.58, 0.07, 0.3]} look={[0.5, 0.4, 0.75]} />
        <Eye pal={pal} p={[0.58, 0.07, -0.3]} look={[0.5, 0.4, 0.75]} />
        <Cheek pal={pal} p={[0.66, -0.1, 0.27]} size={0.06} />
        <Cheek pal={pal} p={[0.66, -0.1, -0.27]} size={0.06} />
        <Smile pal={pal} p={[0.86, -0.16, 0.12]} size={0.045} face={1.1} />
        <group ref={tail} position={[-0.85, 0, 0]}>
          <Cone m={pal.body} p={[-0.25, 0, 0]} s={[0.2, 0.5, 0.2]} r={[0, 0, PI / 2]} />
          <Ball m={pal.dark} p={[-0.52, 0, 0.15]} s={[0.1, 0.04, 0.2]} r={[0, 0.5, 0]} d={8} />
          <Ball m={pal.dark} p={[-0.52, 0, -0.15]} s={[0.1, 0.04, 0.2]} r={[0, -0.5, 0]} d={8} />
        </group>
      </group>
    </group>
  );
};

const Wolf: Rig = (pal, register) => {
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  register((t) => {
    if (head.current) {
      head.current.rotation.y = FACE_VIEWER + Math.sin(t * 0.7) * 0.18;
      head.current.rotation.z = Math.sin(t * 1.4) * 0.06;
      head.current.rotation.x = Math.sin(t * 0.5) * 0.08;
    }
    if (tail.current) tail.current.rotation.x = Math.sin(t * 5) * 0.4;
    legs.current.forEach((l, i) => l && (l.rotation.z = Math.sin(t * 3 + (i % 2) * PI) * 0.1));
  });
  const legAt: V3[] = [
    [0.34, -0.22, 0.2],
    [0.34, -0.22, -0.2],
    [-0.36, -0.22, 0.2],
    [-0.36, -0.22, -0.2],
  ];
  return (
    <group position={[-0.1, 0, 0]}>
      <Ball m={pal.body} s={[0.62, 0.4, 0.38]} d={14} />
      <Ball m={pal.light} p={[0.3, -0.06, 0]} s={[0.32, 0.28, 0.3]} d={12} />
      {legAt.map((p, i) => (
        <group key={i} ref={(g) => (legs.current[i] = g)} position={p}>
          <Leg m={pal.dark} p={[0, 0, 0]} len={0.28} w={0.1} />
        </group>
      ))}
      <group ref={head} position={[0.6, 0.42, 0]} rotation={[0, FACE_VIEWER, 0]}>
        <Ball m={pal.body} s={[0.42, 0.39, 0.4]} />
        <Ball m={pal.light} p={[0.3, -0.12, 0]} s={[0.19, 0.14, 0.18]} d={12} />
        <Ball m={pal.eye} p={[0.48, -0.06, 0]} s={[0.06, 0.05, 0.065]} d={6} />
        <Smile pal={pal} p={[0.46, -0.19, 0]} size={0.045} />
        <Cone m={pal.dark} p={[0, 0.38, 0.2]} s={[0.13, 0.3, 0.09]} r={[0.3, 0, 0]} seg={6} />
        <Cone m={pal.dark} p={[0, 0.38, -0.2]} s={[0.13, 0.3, 0.09]} r={[-0.3, 0, 0]} seg={6} />
        <Cone m={pal.light} p={[0.05, 0.36, 0.19]} s={[0.07, 0.19, 0.05]} r={[0.3, 0, 0]} seg={6} />
        <Cone m={pal.light} p={[0.05, 0.36, -0.19]} s={[0.07, 0.19, 0.05]} r={[-0.3, 0, 0]} seg={6} />
        <Eye pal={pal} p={[0.3, 0.1, 0.17]} />
        <Eye pal={pal} p={[0.3, 0.1, -0.17]} />
        <Cheek pal={pal} p={[0.27, -0.1, 0.28]} />
        <Cheek pal={pal} p={[0.27, -0.1, -0.28]} />
      </group>
      <group ref={tail} position={[-0.55, 0.15, 0]} rotation={[0, 0, 0.9]}>
        <Ball m={pal.body} p={[0, 0.2, 0]} s={[0.13, 0.24, 0.13]} d={12} />
        <Ball m={pal.light} p={[0, 0.4, 0]} s={[0.1, 0.1, 0.1]} d={10} />
      </group>
    </group>
  );
};

const Bear: Rig = (pal, register) => {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  register((t) => {
    if (body.current) body.current.rotation.x = Math.sin(t * 0.9) * 0.05;
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.2) * 0.025;
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.9 + 0.5) * 0.1;
      head.current.rotation.y = FACE_VIEWER + Math.sin(t * 0.6) * 0.12;
    }
  });
  return (
    <group ref={body} position={[-0.1, -0.05, 0]}>
      <Ball m={pal.body} s={[0.62, 0.55, 0.55]} />
      <Ball m={pal.light} p={[0.3, -0.1, 0]} s={[0.36, 0.36, 0.4]} />
      {(
        [
          [0.32, -0.38, 0.28],
          [0.32, -0.38, -0.28],
          [-0.32, -0.38, 0.28],
          [-0.32, -0.38, -0.28],
        ] as V3[]
      ).map((p, i) => (
        <Leg key={i} m={pal.body} p={p} len={0.22} w={0.16} />
      ))}
      <group ref={head} position={[0.55, 0.5, 0]} rotation={[0, FACE_VIEWER, 0]}>
        <Ball m={pal.body} s={[0.5, 0.46, 0.48]} />
        <Ball m={pal.light} p={[0.38, -0.12, 0]} s={[0.2, 0.15, 0.2]} d={12} />
        <Ball m={pal.eye} p={[0.57, -0.06, 0]} s={[0.07, 0.05, 0.08]} d={6} />
        <Smile pal={pal} p={[0.56, -0.19, 0]} size={0.045} />
        <Ball m={pal.body} p={[-0.02, 0.4, 0.3]} s={[0.07, 0.15, 0.15]} d={10} />
        <Ball m={pal.body} p={[-0.02, 0.4, -0.3]} s={[0.07, 0.15, 0.15]} d={10} />
        <Ball m={pal.light} p={[0.03, 0.4, 0.3]} s={[0.05, 0.1, 0.1]} d={10} />
        <Ball m={pal.light} p={[0.03, 0.4, -0.3]} s={[0.05, 0.1, 0.1]} d={10} />
        <Eye pal={pal} p={[0.37, 0.1, 0.2]} />
        <Eye pal={pal} p={[0.37, 0.1, -0.2]} />
        <Cheek pal={pal} p={[0.33, -0.1, 0.32]} />
        <Cheek pal={pal} p={[0.33, -0.1, -0.32]} />
      </group>
      <Ball m={pal.body} p={[-0.62, 0.1, 0]} s={[0.12, 0.12, 0.12]} d={10} />
    </group>
  );
};

const Hummingbird: Rig = (pal, register) => {
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  register((t) => {
    const flap = Math.sin(t * 38) * 0.9;
    if (wingL.current) wingL.current.rotation.x = 0.4 + flap;
    if (wingR.current) wingR.current.rotation.x = -0.4 - flap;
    if (body.current) {
      body.current.position.y = Math.sin(t * 3) * 0.08;
      body.current.rotation.z = 0.3 + Math.sin(t * 1.3) * 0.06;
    }
    if (head.current) head.current.rotation.z = -0.25 + Math.sin(t * 1.7) * 0.1;
  });
  return (
    <group ref={body} scale={1.2}>
      <Ball m={pal.body} s={[0.42, 0.3, 0.28]} />
      <Ball m={pal.light} p={[0.08, -0.12, 0]} s={[0.3, 0.18, 0.2]} d={12} />
      <group ref={head} position={[0.4, 0.18, 0]} rotation={[0, -0.5, -0.25]}>
        <Ball m={pal.body} s={[0.26, 0.25, 0.25]} />
        <Cone m={pal.dark} p={[0.4, -0.02, 0]} s={[0.03, 0.34, 0.03]} r={[0, 0, -PI / 2 - 0.08]} seg={5} />
        <Eye pal={pal} p={[0.16, 0.06, 0.12]} size={0.065} />
        <Eye pal={pal} p={[0.16, 0.06, -0.12]} size={0.065} />
        <Cheek pal={pal} p={[0.15, -0.07, 0.18]} size={0.05} />
        <Cheek pal={pal} p={[0.15, -0.07, -0.18]} size={0.05} />
      </group>
      <Cone m={pal.dark} p={[-0.5, -0.05, 0]} s={[0.12, 0.34, 0.04]} r={[0, 0, PI / 2 + 0.2]} seg={4} />
      <group ref={wingL} position={[0.0, 0.18, 0.15]}>
        <Ball m={pal.light} p={[-0.1, 0, 0.3]} s={[0.16, 0.025, 0.32]} r={[0, 0.4, 0]} d={8} />
      </group>
      <group ref={wingR} position={[0.0, 0.18, -0.15]}>
        <Ball m={pal.light} p={[-0.1, 0, -0.3]} s={[0.16, 0.025, 0.32]} r={[0, -0.4, 0]} d={8} />
      </group>
    </group>
  );
};

const Fox: Rig = (pal, register) => {
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  register((t) => {
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.6) * 0.45;
    if (head.current) {
      head.current.rotation.y = FACE_VIEWER + Math.sin(t * 0.8) * 0.2;
      head.current.rotation.z = Math.sin(t * 0.6) * 0.08;
    }
    // A quick ear twitch every few seconds.
    if (earL.current) earL.current.rotation.x = Math.max(0, Math.sin(t * 2.2) - 0.9) * 3;
  });
  return (
    <group position={[0.05, 0, 0]}>
      <Ball m={pal.body} s={[0.55, 0.32, 0.3]} />
      <Ball m={pal.light} p={[0.25, -0.06, 0]} s={[0.28, 0.24, 0.24]} d={12} />
      {(
        [
          [0.3, -0.18, 0.15],
          [0.3, -0.18, -0.15],
          [-0.3, -0.18, 0.15],
          [-0.3, -0.18, -0.15],
        ] as V3[]
      ).map((p, i) => (
        <Leg key={i} m={pal.dark} p={p} len={0.28} w={0.075} />
      ))}
      <group ref={head} position={[0.55, 0.36, 0]} rotation={[0, FACE_VIEWER, 0]}>
        <Ball m={pal.body} s={[0.38, 0.34, 0.36]} />
        <Ball m={pal.light} p={[0.16, -0.12, 0.2]} s={[0.2, 0.15, 0.17]} d={12} />
        <Ball m={pal.light} p={[0.16, -0.12, -0.2]} s={[0.2, 0.15, 0.17]} d={12} />
        <Cone m={pal.light} p={[0.42, -0.1, 0]} s={[0.11, 0.24, 0.11]} r={[0, 0, -PI / 2]} />
        <Ball m={pal.eye} p={[0.54, -0.1, 0]} s={[0.045, 0.04, 0.045]} d={6} />
        <group ref={earL}>
          <Cone m={pal.body} p={[-0.02, 0.4, 0.17]} s={[0.15, 0.36, 0.08]} r={[0.25, 0, 0]} seg={6} />
          <Cone m={pal.light} p={[0.03, 0.38, 0.17]} s={[0.09, 0.24, 0.05]} r={[0.25, 0, 0]} seg={6} />
        </group>
        <Cone m={pal.body} p={[-0.02, 0.4, -0.17]} s={[0.15, 0.36, 0.08]} r={[-0.25, 0, 0]} seg={6} />
        <Cone m={pal.light} p={[0.03, 0.38, -0.17]} s={[0.09, 0.24, 0.05]} r={[-0.25, 0, 0]} seg={6} />
        <Eye pal={pal} p={[0.27, 0.08, 0.15]} size={0.075} />
        <Eye pal={pal} p={[0.27, 0.08, -0.15]} size={0.075} />
        <Cheek pal={pal} p={[0.26, -0.06, 0.26]} size={0.06} />
        <Cheek pal={pal} p={[0.26, -0.06, -0.26]} size={0.06} />
      </group>
      <group ref={tail} position={[-0.5, 0.05, 0]}>
        <Ball m={pal.body} p={[-0.3, 0.18, 0]} s={[0.36, 0.2, 0.2]} r={[0, 0, 0.6]} />
        <Ball m={pal.light} p={[-0.56, 0.4, 0]} s={[0.16, 0.14, 0.14]} d={12} />
      </group>
    </group>
  );
};

const TENTACLES = 8;
const SEGMENTS = 5;

// Points on the octopus mantle facing the viewer, by angle from +x toward +z.
function onMantle(angle: number, y: number, r: number): V3 {
  return [Math.cos(angle) * r, y, Math.sin(angle) * r];
}

const Octopus: Rig = (pal, register) => {
  const segs = useRef<(THREE.Group | null)[]>([]);
  const mantle = useRef<THREE.Group>(null);
  register((t) => {
    segs.current.forEach((g, k) => {
      if (!g) return;
      const arm = Math.floor(k / SEGMENTS);
      const seg = k % SEGMENTS;
      // A gentle outward curl with a travelling wave down each arm.
      g.rotation.x = (seg === 0 ? 1.0 : seg < 3 ? 0.05 : -0.25) + Math.sin(t * 2.2 - seg * 0.8 + arm * 0.9) * 0.22;
    });
    if (mantle.current) {
      mantle.current.scale.set(1 + Math.sin(t * 1.6) * 0.04, 1 - Math.sin(t * 1.6) * 0.04, 1 + Math.sin(t * 1.6) * 0.04);
    }
  });
  const arm = (a: number) => {
    // Nested segments so each one bends relative to the last.
    let node: React.ReactElement | null = null;
    for (let s = SEGMENTS - 1; s >= 0; s--) {
      const k = a * SEGMENTS + s;
      const w = 0.12 * (1 - s / (SEGMENTS + 2));
      node = (
        <group ref={(g) => (segs.current[k] = g)} position={[0, s === 0 ? 0 : -0.17, 0]}>
          <Ball m={s % 2 ? pal.light : pal.body} p={[0, -0.09, 0]} s={[w, 0.12, w]} d={6} />
          {node}
        </group>
      );
    }
    return (
      <group key={a} rotation={[0, (a / TENTACLES) * PI * 2, 0]}>
        <group position={[0, -0.12, 0.3]}>{node}</group>
      </group>
    );
  };
  // The viewer sits about 1 radian round from +x in the animal's frame.
  const front = 1.0;
  return (
    <group position={[0, 0.3, 0]}>
      <group ref={mantle}>
        <Ball m={pal.body} p={[0, 0.22, 0]} s={[0.52, 0.5, 0.52]} />
        <Eye pal={pal} p={onMantle(front - 0.42, 0.06, 0.49)} size={0.1} look={[0.5, 0.4, 0.8]} />
        <Eye pal={pal} p={onMantle(front + 0.42, 0.06, 0.49)} size={0.1} look={[0.5, 0.4, 0.8]} />
        <Cheek pal={pal} p={onMantle(front - 0.62, -0.1, 0.48)} size={0.07} />
        <Cheek pal={pal} p={onMantle(front + 0.62, -0.1, 0.48)} size={0.07} />
        <Smile pal={pal} p={onMantle(front, -0.08, 0.52)} size={0.05} face={front} />
      </group>
      {Array.from({ length: TENTACLES }, (_, a) => arm(a))}
    </group>
  );
};

const RIGS: Record<AnimalId, Rig> = {
  dolphin: Dolphin,
  wolf: Wolf,
  bear: Bear,
  hummingbird: Hummingbird,
  fox: Fox,
  octopus: Octopus,
};

function AnimalBody({ animal, pal, register }: { animal: AnimalId; pal: Palette; register: (fn: Animate) => void }) {
  return RIGS[animal](pal, register);
}

const BLINK_EVERY = 3.8;
const BLINK_SECONDS = 0.16;

export default function Animal({
  animal,
  color,
  mood,
  hop = 0,
  still = false,
}: {
  animal: AnimalId;
  color: string;
  mood?: Mood | null;
  // Increment to make the animal hop (e.g. when a check-in is saved).
  hop?: number;
  still?: boolean;
}) {
  const pal = usePalette(color);
  const outer = useRef<THREE.Group>(null);
  const parts = useRef<Animate | null>(null);
  const clock = useRef(0);
  const hopAt = useRef(-10);
  const blink = useRef({ v: 1 }).current;
  const m = useRef(moodMotion(mood));
  const target = moodMotion(mood);

  useEffect(() => {
    if (hop > 0) hopAt.current = clock.current;
  }, [hop]);

  useFrame((_, rawDt) => {
    const dt = still ? 0 : Math.min(rawDt, 0.05);
    // Ease between moods so a change reads as the animal reacting.
    m.current = {
      speed: damp(m.current.speed, target.speed, 3, dt || 1),
      bounce: damp(m.current.bounce, target.bounce, 3, dt || 1),
      jitter: damp(m.current.jitter, target.jitter, 3, dt || 1),
      droop: damp(m.current.droop, target.droop, 3, dt || 1),
    };
    const mm = m.current;
    clock.current += dt;
    // A quick blink every few seconds (eyes stay open when motion is reduced).
    const since = clock.current % BLINK_EVERY;
    blink.v = since < BLINK_SECONDS ? Math.max(0.08, 1 - Math.sin((since / BLINK_SECONDS) * Math.PI)) : 1;
    const t = clock.current * mm.speed;
    parts.current?.(t);
    const g = outer.current;
    if (!g) return;
    const bounce = Math.abs(Math.sin(t * 2.4)) * mm.bounce;
    const hop = hopHeight(clock.current - hopAt.current);
    g.position.y = bounce + hop;
    g.rotation.z = -mm.droop + (mm.jitter ? Math.sin(clock.current * 47) * mm.jitter : 0);
    g.position.x = mm.jitter ? Math.sin(clock.current * 39) * mm.jitter * 0.6 : 0;
    // Squash on landing, stretch in the air.
    const sq = hop > 0 ? 1 + hop * 0.25 : 1 - bounce * 0.15;
    g.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  });

  return (
    <group rotation={[0.12, -0.55, 0]}>
      <group ref={outer}>
        <BlinkContext.Provider value={blink}>
          <AnimalBody
            key={animal}
            animal={animal}
            pal={pal}
            register={(fn) => {
              parts.current = fn;
            }}
          />
        </BlinkContext.Provider>
      </group>
    </group>
  );
}
