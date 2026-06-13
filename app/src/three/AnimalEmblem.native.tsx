import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { AnimalId } from '../data/archetypes';

// An abstract, *moving* 3D emblem per archetype. Not a rigged species model
// (that needs authored GLTF assets) — instead each animal gets a distinct
// low-poly form and motion signature that reads as its character: the Dolphin
// glides, the Hummingbird buzzes fast, the Bear lumbers, the Octopus writhes.

interface Cfg {
  geometry: React.ReactNode;
  spin: number; // y-rotation speed
  bob: number; // vertical bob frequency
  tilt: number; // x-wobble amount
}

function geoFor(animal: AnimalId): Cfg {
  switch (animal) {
    case 'dolphin': // sleek, gliding
      return { geometry: <torusKnotGeometry args={[0.9, 0.28, 120, 16]} />, spin: 0.5, bob: 1.1, tilt: 0.25 };
    case 'wolf': // angular, sharp
      return { geometry: <icosahedronGeometry args={[1.25, 0]} />, spin: 0.9, bob: 0.7, tilt: 0.1 };
    case 'bear': // big, rounded, slow
      return { geometry: <dodecahedronGeometry args={[1.3, 0]} />, spin: 0.25, bob: 0.6, tilt: 0.08 };
    case 'hummingbird': // small, fast, buzzing
      return { geometry: <octahedronGeometry args={[1.0, 0]} />, spin: 2.4, bob: 3.2, tilt: 0.3 };
    case 'fox': // pointed, alert
      return { geometry: <coneGeometry args={[1.0, 1.9, 7]} />, spin: 1.1, bob: 0.9, tilt: 0.15 };
    case 'octopus': // many-armed, writhing
      return { geometry: <torusKnotGeometry args={[0.85, 0.34, 140, 20, 2, 5]} />, spin: 0.7, bob: 1.4, tilt: 0.35 };
  }
}

function Creature({ animal, accent }: { animal: AnimalId; accent: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const cfg = geoFor(animal);

  useFrame((state, delta) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.rotation.y += cfg.spin * delta;
    m.rotation.x = Math.sin(t * cfg.bob) * cfg.tilt;
    m.position.y = Math.sin(t * cfg.bob) * 0.12;
  });

  return (
    <mesh ref={ref}>
      {cfg.geometry}
      <meshStandardMaterial color={accent} roughness={0.35} metalness={0.2} flatShading />
    </mesh>
  );
}

function Sparks({ accent }: { accent: string }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = React.useMemo(() => {
    const n = 40;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.8 + Math.random() * 1.4;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.25;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color={accent}
        size={0.08}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function AnimalEmblem({
  animal,
  accent,
  bg = '#0b1a16',
  style,
}: {
  animal: AnimalId;
  accent: string;
  emoji?: string;
  bg?: string;
  style?: any;
}) {
  return (
    <Canvas style={style} gl={{ antialias: true }} camera={{ position: [0, 0, 4.6], fov: 55 }}>
      <color attach="background" args={[bg]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} color="#ffffff" />
      <pointLight position={[-4, -2, 2]} intensity={0.8} color={accent} />
      <Creature animal={animal} accent={accent} />
      <Sparks accent={accent} />
    </Canvas>
  );
}
