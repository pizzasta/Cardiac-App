// Low-poly rhythm animals, built from primitives and animated in code (no
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
// Shapes are high-detail so smooth shading reads as rounded, not faceted.
// `d` is a relative detail hint from the original low-poly design: tiny
// parts (eyes, highlights) stay lighter, everything else gets 32x24.
function Ball({ m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], d = 14 }: { m: THREE.Material; p?: V3; s?: V3; r?: V3; d?: number }) {
  const w = d <= 6 ? 16 : 32;
  return (
    <mesh material={m} position={p} scale={s} rotation={r}>
      <sphereGeometry args={[1, w, Math.round(w * 0.75)]} />
    </mesh>
  );
}
function Cone({ m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], seg = 8 }: { m: THREE.Material; p?: V3; s?: V3; r?: V3; seg?: number }) {
  return (
    <mesh material={m} position={p} scale={s} rotation={r}>
      <coneGeometry args={[1, 1, Math.max(24, seg * 4), 4]} />
    </mesh>
  );
}
function Leg({ m, p, len = 0.5, w = 0.11 }: { m: THREE.Material; p: V3; len?: number; w?: number }) {
  return (
    <group>
      <mesh material={m} position={[p[0], p[1] - len / 2, p[2]]}>
        <cylinderGeometry args={[w, w * 0.85, len, 20]} />
      </mesh>
      {/* Rounded foot */}
      <mesh material={m} position={[p[0], p[1] - len, p[2]]} scale={[w * 0.95, w * 0.7, w * 0.95]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  );
}
function Eye({ pal, p, size = 0.07 }: { pal: Palette; p: V3; size?: number }) {
  return (
    <group position={p}>
      <Ball m={pal.eye} s={[size, size, size]} d={10} />
      <Ball m={pal.shine} p={[size * 0.35, size * 0.35, size * 0.6]} s={[size * 0.3, size * 0.3, size * 0.3]} d={6} />
    </group>
  );
}

// Per-animal rigs. Each returns its meshes and registers an `animate(t)` that
// moves its parts (t is already scaled by mood speed).
type Animate = (t: number) => void;
type Rig = (pal: Palette, register: (fn: Animate) => void) => React.ReactElement;

const PI = Math.PI;

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
    <group ref={body}>
      <Ball m={pal.body} s={[1.1, 0.42, 0.4]} d={18} />
      <Ball m={pal.light} p={[0.15, -0.14, 0]} s={[0.85, 0.26, 0.3]} d={14} />
      <Cone m={pal.body} p={[1.2, -0.04, 0]} s={[0.13, 0.42, 0.13]} r={[0, 0, -PI / 2]} />
      <Cone m={pal.dark} p={[-0.05, 0.47, 0]} s={[0.16, 0.38, 0.06]} r={[0, 0, 0.55]} />
      <Cone m={pal.dark} p={[0.25, -0.38, 0.28]} s={[0.1, 0.32, 0.05]} r={[0.6, 0, 0.9]} />
      <Cone m={pal.dark} p={[0.25, -0.38, -0.28]} s={[0.1, 0.32, 0.05]} r={[-0.6, 0, 0.9]} />
      <Eye pal={pal} p={[0.82, 0.08, 0.27]} />
      <Eye pal={pal} p={[0.82, 0.08, -0.27]} />
      <group ref={tail} position={[-1.0, 0, 0]}>
        <Cone m={pal.body} p={[-0.32, 0, 0]} s={[0.18, 0.62, 0.18]} r={[0, 0, PI / 2]} />
        <Ball m={pal.dark} p={[-0.68, 0, 0.18]} s={[0.12, 0.05, 0.24]} r={[0, 0.5, 0]} d={8} />
        <Ball m={pal.dark} p={[-0.68, 0, -0.18]} s={[0.12, 0.05, 0.24]} r={[0, -0.5, 0]} d={8} />
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
      head.current.rotation.y = Math.sin(t * 0.7) * 0.25;
      head.current.rotation.z = 0.1 + Math.sin(t * 1.4) * 0.05;
    }
    if (tail.current) tail.current.rotation.x = Math.sin(t * 4) * 0.35;
    legs.current.forEach((l, i) => l && (l.rotation.z = Math.sin(t * 3 + (i % 2) * PI) * 0.12));
  });
  const legAt: V3[] = [
    [0.55, -0.25, 0.22],
    [0.55, -0.25, -0.22],
    [-0.5, -0.25, 0.22],
    [-0.5, -0.25, -0.22],
  ];
  return (
    <group>
      <Ball m={pal.body} s={[0.85, 0.42, 0.38]} d={10} />
      <Ball m={pal.light} p={[0.3, -0.15, 0]} s={[0.5, 0.25, 0.3]} d={8} />
      {legAt.map((p, i) => (
        <group key={i} ref={(g) => (legs.current[i] = g)} position={p}>
          <Leg m={pal.dark} p={[0, 0, 0]} len={0.62} w={0.09} />
        </group>
      ))}
      <group ref={head} position={[0.95, 0.32, 0]}>
        <Ball m={pal.body} s={[0.36, 0.32, 0.3]} d={10} />
        <Cone m={pal.light} p={[0.4, -0.08, 0]} s={[0.15, 0.4, 0.15]} r={[0, 0, -PI / 2]} seg={6} />
        <Ball m={pal.eye} p={[0.62, -0.06, 0]} s={[0.05, 0.05, 0.05]} d={6} />
        <Cone m={pal.dark} p={[-0.05, 0.36, 0.14]} s={[0.1, 0.26, 0.07]} r={[0.15, 0, 0.1]} seg={4} />
        <Cone m={pal.dark} p={[-0.05, 0.36, -0.14]} s={[0.1, 0.26, 0.07]} r={[-0.15, 0, 0.1]} seg={4} />
        <Eye pal={pal} p={[0.24, 0.1, 0.18]} size={0.05} />
        <Eye pal={pal} p={[0.24, 0.1, -0.18]} size={0.05} />
      </group>
      <group ref={tail} position={[-0.8, 0.15, 0]} rotation={[0, 0, 0.7]}>
        <Cone m={pal.dark} p={[0, 0.3, 0]} s={[0.13, 0.7, 0.13]} r={[0, 0, PI]} seg={6} />
      </group>
    </group>
  );
};

const Bear: Rig = (pal, register) => {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  register((t) => {
    if (body.current) body.current.rotation.x = Math.sin(t * 0.9) * 0.06;
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.2) * 0.025;
    if (head.current) head.current.rotation.z = Math.sin(t * 0.9 + 0.5) * 0.1;
  });
  return (
    <group ref={body}>
      <Ball m={pal.body} s={[0.9, 0.62, 0.62]} d={12} />
      {(
        [
          [0.5, -0.45, 0.3],
          [0.5, -0.45, -0.3],
          [-0.45, -0.45, 0.3],
          [-0.45, -0.45, -0.3],
        ] as V3[]
      ).map((p, i) => (
        <Leg key={i} m={pal.dark} p={p} len={0.4} w={0.17} />
      ))}
      <group ref={head} position={[0.85, 0.35, 0]}>
        <Ball m={pal.body} s={[0.45, 0.42, 0.42]} d={12} />
        <Ball m={pal.light} p={[0.36, -0.08, 0]} s={[0.2, 0.15, 0.18]} d={10} />
        <Ball m={pal.eye} p={[0.55, -0.04, 0]} s={[0.06, 0.05, 0.06]} d={6} />
        <Ball m={pal.dark} p={[-0.05, 0.38, 0.26]} s={[0.12, 0.12, 0.07]} d={8} />
        <Ball m={pal.dark} p={[-0.05, 0.38, -0.26]} s={[0.12, 0.12, 0.07]} d={8} />
        <Eye pal={pal} p={[0.3, 0.12, 0.22]} size={0.055} />
        <Eye pal={pal} p={[0.3, 0.12, -0.22]} size={0.055} />
      </group>
      <Ball m={pal.dark} p={[-0.9, 0.15, 0]} s={[0.1, 0.1, 0.1]} d={6} />
    </group>
  );
};

const Hummingbird: Rig = (pal, register) => {
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  register((t) => {
    const flap = Math.sin(t * 38) * 0.9;
    if (wingL.current) wingL.current.rotation.x = 0.4 + flap;
    if (wingR.current) wingR.current.rotation.x = -0.4 - flap;
    if (body.current) {
      body.current.position.y = Math.sin(t * 3) * 0.08;
      body.current.rotation.z = 0.35 + Math.sin(t * 1.3) * 0.06;
    }
  });
  return (
    <group ref={body} scale={1.15}>
      <Ball m={pal.body} s={[0.55, 0.3, 0.28]} d={12} />
      <Ball m={pal.light} p={[0.1, -0.12, 0]} s={[0.38, 0.18, 0.2]} d={10} />
      <Ball m={pal.body} p={[0.55, 0.12, 0]} s={[0.22, 0.21, 0.2]} d={10} />
      <Cone m={pal.dark} p={[0.98, 0.08, 0]} s={[0.03, 0.55, 0.03]} r={[0, 0, -PI / 2 - 0.1]} seg={5} />
      <Eye pal={pal} p={[0.66, 0.18, 0.15]} size={0.045} />
      <Eye pal={pal} p={[0.66, 0.18, -0.15]} size={0.045} />
      <Cone m={pal.dark} p={[-0.62, -0.05, 0]} s={[0.12, 0.42, 0.04]} r={[0, 0, PI / 2 + 0.2]} seg={4} />
      <group ref={wingL} position={[0.05, 0.18, 0.15]}>
        <Ball m={pal.light} p={[-0.1, 0, 0.42]} s={[0.22, 0.03, 0.45]} r={[0, 0.4, 0]} d={8} />
      </group>
      <group ref={wingR} position={[0.05, 0.18, -0.15]}>
        <Ball m={pal.light} p={[-0.1, 0, -0.42]} s={[0.22, 0.03, 0.45]} r={[0, -0.4, 0]} d={8} />
      </group>
    </group>
  );
};

const Fox: Rig = (pal, register) => {
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  register((t) => {
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.6) * 0.45;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.8) * 0.3;
    // A quick ear twitch every few seconds.
    if (earL.current) earL.current.rotation.x = 0.2 + Math.max(0, Math.sin(t * 2.2) - 0.9) * 3;
  });
  return (
    <group>
      <Ball m={pal.body} s={[0.72, 0.32, 0.3]} d={10} />
      <Ball m={pal.light} p={[0.3, -0.12, 0]} s={[0.4, 0.2, 0.24]} d={8} />
      {(
        [
          [0.45, -0.2, 0.17],
          [0.45, -0.2, -0.17],
          [-0.42, -0.2, 0.17],
          [-0.42, -0.2, -0.17],
        ] as V3[]
      ).map((p, i) => (
        <Leg key={i} m={pal.dark} p={p} len={0.5} w={0.06} />
      ))}
      <group ref={head} position={[0.8, 0.28, 0]}>
        <Ball m={pal.body} s={[0.28, 0.25, 0.26]} d={10} />
        <Cone m={pal.light} p={[0.34, -0.06, 0]} s={[0.12, 0.38, 0.12]} r={[0, 0, -PI / 2]} seg={6} />
        <Ball m={pal.eye} p={[0.54, -0.05, 0]} s={[0.04, 0.04, 0.04]} d={6} />
        <mesh ref={earL} material={pal.dark} position={[-0.02, 0.33, 0.13]} scale={[0.1, 0.32, 0.06]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[1, 1, 24, 4]} />
        </mesh>
        <Cone m={pal.dark} p={[-0.02, 0.33, -0.13]} s={[0.1, 0.32, 0.06]} r={[-0.2, 0, 0]} seg={4} />
        <Eye pal={pal} p={[0.2, 0.08, 0.16]} size={0.045} />
        <Eye pal={pal} p={[0.2, 0.08, -0.16]} size={0.045} />
      </group>
      <group ref={tail} position={[-0.68, 0.05, 0]}>
        <Ball m={pal.body} p={[-0.45, 0.1, 0]} s={[0.5, 0.2, 0.2]} r={[0, 0, 0.3]} d={10} />
        <Ball m={pal.light} p={[-0.9, 0.25, 0]} s={[0.15, 0.12, 0.12]} d={8} />
      </group>
    </group>
  );
};

const TENTACLES = 8;
const SEGMENTS = 5;

const Octopus: Rig = (pal, register) => {
  const segs = useRef<(THREE.Group | null)[]>([]);
  const mantle = useRef<THREE.Group>(null);
  register((t) => {
    segs.current.forEach((g, k) => {
      if (!g) return;
      const arm = Math.floor(k / SEGMENTS);
      const seg = k % SEGMENTS;
      // A gentle outward curl with a travelling wave down each arm.
      g.rotation.x = (seg === 0 ? 0.55 : 0.1) + Math.sin(t * 2.2 - seg * 0.8 + arm * 0.9) * 0.22;
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
      const w = 0.12 * (1 - s / (SEGMENTS + 1));
      node = (
        <group ref={(g) => (segs.current[k] = g)} position={[0, s === 0 ? 0 : -0.22, 0]}>
          <Ball m={s % 2 ? pal.light : pal.body} p={[0, -0.11, 0]} s={[w, 0.14, w]} d={8} />
          {node}
        </group>
      );
    }
    return (
      <group key={a} rotation={[0, (a / TENTACLES) * PI * 2, 0]}>
        <group position={[0, -0.2, 0.36]}>{node}</group>
      </group>
    );
  };
  return (
    <group position={[0, 0.35, 0]}>
      <group ref={mantle}>
        <Ball m={pal.body} p={[0, 0.25, 0]} s={[0.5, 0.62, 0.5]} d={16} />
        <Eye pal={pal} p={[0.3, 0.05, 0.3]} size={0.08} />
        <Eye pal={pal} p={[0.42, 0.05, -0.1]} size={0.08} />
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
        <AnimalBody
          key={animal}
          animal={animal}
          pal={pal}
          register={(fn) => {
            parts.current = fn;
          }}
        />
      </group>
    </group>
  );
}
