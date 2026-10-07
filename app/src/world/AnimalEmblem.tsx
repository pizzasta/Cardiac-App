import React, { useRef } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as THREE from 'three';
import { Canvas, useFrame } from './fiber';
import GLBoundary from './GLBoundary';
import { creatureFor } from './creatures';
import { dotTexture } from './textures';
import { AnimalId } from '../data/archetypes';

// The rhythm animal as a moving 3D form, on web and native. Falls back to the
// emoji when WebGL isn't available.

function Creature({ animal, accent }: { animal: AnimalId; accent: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const cfg = creatureFor(animal);
  useFrame((state, delta) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.rotation.y += cfg.spin * Math.min(delta, 0.05);
    m.rotation.x = Math.sin(t * cfg.bob) * cfg.tilt;
    m.position.y = Math.sin(t * cfg.bob) * 0.12;
  });
  return (
    <mesh ref={ref}>
      {cfg.geometry}
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} roughness={0.35} metalness={0.2} flatShading />
    </mesh>
  );
}

function Sparks({ accent }: { accent: string }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = React.useMemo(() => {
    const n = 48;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.8 + Math.random() * 1.4;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= Math.min(delta, 0.05) * 0.25;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color={accent}
        size={0.16}
        map={dotTexture()}
        transparent
        opacity={0.9}
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
  emoji = '✦',
  bg = '#0b1a16',
  style,
}: {
  animal: AnimalId;
  accent: string;
  emoji?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const fallback = (
    <View style={[styles.fallback, { backgroundColor: bg }, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
  return (
    <GLBoundary fallback={fallback}>
      <View style={style} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill as any} camera={{ position: [0, 0, 4.6], fov: 55 }}>
          <color attach="background" args={[bg]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 5]} intensity={1.3} color="#ffffff" />
          <pointLight position={[-4, -2, 2]} intensity={8} color={accent} />
          <Creature animal={animal} accent={accent} />
          <Sparks accent={accent} />
        </Canvas>
      </View>
    </GLBoundary>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 96 },
});
