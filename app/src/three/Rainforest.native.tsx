import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// A stylized Amazon-rainforest scene, tuned to Circadia's dusk palette:
// deep teal-green fog, layered canopy, a shaft of warm light, and slow
// bioluminescent spores drifting up through the trees. Built to stay light on
// mobile — trunks and foliage are instanced, particles are a single Points.

const TREE_COUNT = 34;
const SPORE_COUNT = 90;
const FOG_COLOR = '#0c2018';

// Deterministic-ish PRNG so the forest looks the same each mount.
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface TreeData {
  x: number;
  z: number;
  height: number;
  radius: number;
  rot: number;
}

function Forest() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  const trees = useMemo<TreeData[]>(() => {
    const rng = makeRng(7);
    return Array.from({ length: TREE_COUNT }, () => {
      // Push trees outward into a ring so the camera sits in a clearing.
      const angle = rng() * Math.PI * 2;
      const dist = 6 + rng() * 26;
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist - 8,
        height: 9 + rng() * 12,
        radius: 0.25 + rng() * 0.45,
        rot: rng() * Math.PI,
      };
    });
  }, []);

  const FOLIAGE_PER_TREE = 3;

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const trunk = trunkRef.current;
    const foliage = foliageRef.current;
    if (!trunk || !foliage) return;

    trees.forEach((t, i) => {
      // Trunk: unit cylinder scaled to height; pivot raised to sit on ground.
      dummy.position.set(t.x, t.height / 2 - 6, t.z);
      dummy.scale.set(t.radius, t.height, t.radius);
      dummy.rotation.set(0, t.rot, 0);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);

      // Canopy: stacked blobs near the top, shrinking upward.
      for (let j = 0; j < FOLIAGE_PER_TREE; j++) {
        const idx = i * FOLIAGE_PER_TREE + j;
        const top = t.height - 6;
        const size = (3.2 - j * 0.7) * (0.8 + t.radius);
        dummy.position.set(t.x, top + j * 1.8, t.z);
        dummy.scale.set(size, size * 0.85, size);
        dummy.rotation.set(t.rot, t.rot * 2, 0);
        dummy.updateMatrix();
        foliage.setMatrixAt(idx, dummy.matrix);
      }
    });
    trunk.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, TREE_COUNT]}>
        <cylinderGeometry args={[1, 1.3, 1, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh
        ref={foliageRef}
        args={[undefined, undefined, TREE_COUNT * FOLIAGE_PER_TREE]}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#1f5a3a" roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}

function Spores({ accent }: { accent: string }) {
  const ref = useRef<THREE.Points>(null);

  const { geometry, speeds } = useMemo(() => {
    const rng = makeRng(21);
    const positions = new Float32Array(SPORE_COUNT * 3);
    const spd = new Float32Array(SPORE_COUNT);
    for (let i = 0; i < SPORE_COUNT; i++) {
      positions[i * 3] = (rng() - 0.5) * 30;
      positions[i * 3 + 1] = rng() * 16 - 6;
      positions[i * 3 + 2] = (rng() - 0.5) * 30 - 6;
      spd[i] = 0.3 + rng() * 0.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: g, speeds: spd };
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < SPORE_COUNT; i++) {
      let y = pos.getY(i) + speeds[i] * delta;
      if (y > 12) y = -6; // recycle to the floor
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color={accent}
        size={0.18}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// A few faint additive cones standing in for sun shafts through the canopy.
function LightShafts() {
  return (
    <group position={[4, 6, -10]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 3 - 3, 0, i * 2]} rotation={[0.15, 0, 0.08]}>
          <coneGeometry args={[2.2, 22, 12, 1, true]} />
          <meshBasicMaterial
            color="#bfe9a0"
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ accent }: { accent: string }) {
  // Slow, calm camera drift — a held breath, not a flythrough.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = Math.sin(t * 0.08) * 1.6;
    state.camera.position.y = 1.2 + Math.sin(t * 0.05) * 0.4;
    state.camera.lookAt(0, 3, -10);
  });

  return (
    <>
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 8, 38]} />

      <ambientLight intensity={0.45} color="#8fd6b0" />
      {/* warm canopy light */}
      <directionalLight position={[6, 18, -4]} intensity={1.1} color="#ffe6b0" />
      {/* accent bounce for the bioluminescent feel */}
      <pointLight position={[-6, 3, 2]} intensity={0.6} color={accent} distance={30} />

      <Forest />
      <Spores accent={accent} />
      <LightShafts />

      {/* forest floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, -6]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0a1a12" roughness={1} />
      </mesh>
    </>
  );
}

export default function Rainforest({
  style,
  accent = '#5fe6c0',
}: {
  style?: any;
  accent?: string;
}) {
  return (
    <Canvas
      style={style}
      gl={{ antialias: true }}
      camera={{ position: [0, 1.2, 6], fov: 70, near: 0.1, far: 60 }}
      onCreated={({ gl }) => gl.setClearColor(FOG_COLOR)}
    >
      <Scene accent={accent} />
    </Canvas>
  );
}
