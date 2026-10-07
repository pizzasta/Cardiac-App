import React, { useRef } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as THREE from 'three';
import { Canvas, useFrame } from './fiber';
import GLBoundary from './GLBoundary';
import Animal from './animals';
import { Mood } from './rig';
import { useReducedMotion } from '../hooks';
import { dotTexture } from './textures';
import { AnimalId } from '../data/archetypes';

// The rhythm animal in 3D, moving and reacting to mood, on web and native.
// Falls back to the emoji when WebGL isn't available. Pass bg={null} for a
// transparent canvas that sits on top of other content.

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
  mood = null,
  hop = 0,
  sparks = true,
  style,
}: {
  animal: AnimalId;
  accent: string;
  emoji?: string;
  bg?: string | null;
  mood?: Mood | null;
  hop?: number;
  sparks?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const still = useReducedMotion();
  const fallback = (
    <View style={[styles.fallback, bg ? { backgroundColor: bg } : null, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
  return (
    <GLBoundary fallback={fallback}>
      <View style={style} pointerEvents="none">
        <Canvas
          style={StyleSheet.absoluteFill as any}
          gl={{ alpha: !bg } as any}
          camera={{ position: [0, 0.25, 3.5], fov: 50 }}
        >
          {bg ? <color attach="background" args={[bg]} /> : null}
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={1.6} color="#ffffff" />
          <pointLight position={[-4, -2, 2]} intensity={8} color={accent} />
          <Animal animal={animal} color={accent} mood={mood} hop={hop} still={still} />
          {sparks && <Sparks accent={accent} />}
        </Canvas>
      </View>
    </GLBoundary>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 96 },
});
