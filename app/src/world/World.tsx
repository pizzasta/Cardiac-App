// Rhythm World: one persistent 3D landscape that lives behind every screen.
//
// A natural place rather than a graphic: a physically based sky that follows
// the person's local time (sunrise, golden day, sunset, starry night), rolling
// hills along a quiet valley, two ranges of distant mountains fading into
// haze, low mist and warm fireflies. Your rhythm animal waits on the path
// ahead after the reveal. The camera glides to a different spot for each
// screen (see rig.ts).
//
// Respects "reduce motion" (renders a still frame), pauses in the background,
// and falls back to the flat gradient backdrop when WebGL isn't available.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { Sky as SkyShader } from 'three/examples/jsm/objects/Sky.js';
import { Canvas, useFrame, useThree } from './fiber';
import GLBoundary from './GLBoundary';
import Animal from './animals';
import { dotTexture, glowTexture } from './textures';
import {
  damp,
  daylight,
  Mood,
  ridgeline,
  STATIONS,
  sunElevation,
  sunsetGlow,
  TILE_LENGTH,
  WorldMode,
} from './rig';
import { useLocalHour } from './clock';
import { look as lookInput, stepDrag, useDeviceTilt } from './look';
import { Biome, biomeFor, heightIn } from './biomes';
import { Aurora, Clouds, GrassClock, Particles, ShootingStar, SunGlare, TileFlora, Water } from './nature';
import { AnimalId } from '../data/archetypes';
import Atmosphere from '../components/Atmosphere';
import { T } from '../theme';

const NATIVE = Platform.OS !== 'web';
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BG = '#06060A';
const TILE = { width: 240, cols: NATIVE ? 90 : 160, rows: NATIVE ? 34 : 60 };
const TILES = 3; // leapfrogging ground tiles, nearest to farthest
const TOTEM: [number, number, number] = [0, 1.0, -16];
// Sun and moon directions, as compass angles (180 = straight ahead).
const SUN_AZIMUTH = 180;
const MOON = { azimuth: 145, elevation: 24 };

// Night, twilight and (soft) day colours for haze, sky light and ground.
const PALETTE = {
  fog: { night: new THREE.Color('#0b0d18'), dusk: new THREE.Color('#3a3046'), day: new THREE.Color('#6e7890') },
  sky: { night: new THREE.Color('#1b2340'), dusk: new THREE.Color('#5b4a6e'), day: new THREE.Color('#9fb3d6') },
};

interface Live {
  mode: WorldMode;
  tint: THREE.Color;
  still: boolean;
  // Local hour, refreshed by useLocalHour (every minute and on resume).
  hour: number;
  pointer: { x: number; y: number };
}

// Shared, frame-to-frame state that useFrame reads without re-rendering.
function useLive(mode: WorldMode, tint: string, still: boolean, hour: number): React.MutableRefObject<Live> {
  const live = useRef<Live>({ mode, tint: new THREE.Color(tint), still, hour, pointer: { x: 0, y: 0 } });
  live.current.mode = mode;
  live.current.tint.set(tint);
  live.current.still = still;
  live.current.hour = hour;
  return live;
}

// Smoothed scene parameters that every layer reads.
interface Params {
  travel: number;
  glow: number;
  t: number;
  color: THREE.Color;
  // Sun elevation (degrees) and daylight 0..1, from the local clock.
  elevation: number;
  day: number;
  // Deep-pink sunset glow, 0..1 (evenings only).
  dusk: number;
  fog: THREE.Color;
}


// Mix night → dusk → day for a daylight value (dusk peaks around 0.35).
function timeColor(out: THREE.Color, set: { night: THREE.Color; dusk: THREE.Color; day: THREE.Color }, day: number) {
  if (day < 0.35) return out.copy(set.night).lerp(set.dusk, day / 0.35);
  return out.copy(set.dusk).lerp(set.day, (day - 0.35) / 0.65);
}

function dirFrom(azimuthDeg: number, elevationDeg: number, out = new THREE.Vector3()) {
  return out.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevationDeg),
    THREE.MathUtils.degToRad(azimuthDeg)
  );
}

// How freely each screen lets you look around (tilt and drag): fully on the
// open, scenic screens, a little behind text.
const LOOK_FREEDOM: Record<WorldMode, number> = {
  landing: 1,
  quiz: 0.5,
  reading: 0.3,
  reveal: 0.8,
  home: 1,
  focus: 0.3,
  reset: 0.4,
};

function Rig({ live, params }: { live: React.MutableRefObject<Live>; params: React.MutableRefObject<Params> }) {
  const { camera, scene, gl } = useThree();
  const look = useRef(new THREE.Vector3(...STATIONS[live.current.mode].lookAt));
  const first = useRef(true);
  const turn = useRef({ yaw: 0, pitch: 0 });
  const dir = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { mode, still, pointer, tint } = live.current;
    const s = STATIONS[mode];
    const p = params.current;
    // Snap on the first frame (and always when still) so nothing swoops in.
    const k = first.current || still ? 1000 : 1;
    first.current = false;
    const speed = mode === 'reading' ? 2.4 : 1.4;

    p.elevation = damp(p.elevation, sunElevation(live.current.hour), 0.5 * k, dt);
    p.day = daylight(p.elevation);
    p.dusk = sunsetGlow(live.current.hour, p.elevation);
    timeColor(p.fog, PALETTE.fog, p.day);
    p.fog.lerp(DUSK.fog, 0.75 * p.dusk);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(p.fog);
    // Darker exposure as the day brightens keeps the sky from washing out
    // behind white text.
    gl.toneMappingExposure = 0.5 - 0.36 * p.day - 0.16 * p.dusk;

    p.travel = damp(p.travel, still ? 0 : s.travel, 1.2 * k, dt);
    p.glow = damp(p.glow, s.glow, 2 * k, dt);
    p.color.lerp(tint, 1 - Math.exp(-1.5 * k * dt));
    if (!still) p.t += dt;

    const px = still ? 0 : pointer.x * 0.7;
    const py = still ? 0 : pointer.y * 0.35;
    camera.position.x = damp(camera.position.x, s.camera[0] + px, speed * k, dt);
    camera.position.y = damp(camera.position.y, s.camera[1] + py, speed * k, dt);
    camera.position.z = damp(camera.position.z, s.camera[2], speed * k, dt);
    look.current.x = damp(look.current.x, s.lookAt[0], speed * k, dt);
    look.current.y = damp(look.current.y, s.lookAt[1], speed * k, dt);
    look.current.z = damp(look.current.z, s.lookAt[2], speed * k, dt);

    // Look around: drag momentum and phone tilt turn the view.
    const d = stepDrag(lookInput.dragYaw, lookInput.dragVel, lookInput.dragging, dt);
    lookInput.dragYaw = d.yaw;
    lookInput.dragVel = d.vel;
    const free = still ? 0 : LOOK_FREEDOM[mode];
    turn.current.yaw = damp(turn.current.yaw, (lookInput.dragYaw + lookInput.tiltYaw) * free, 7, dt);
    turn.current.pitch = damp(turn.current.pitch, lookInput.tiltPitch * free, 7, dt);
    dir.copy(look.current).sub(camera.position);
    const len = dir.length();
    dir.applyAxisAngle(Y_AXIS, turn.current.yaw);
    dir.y += turn.current.pitch * len;
    camera.lookAt(target.copy(camera.position).add(dir));
  });
  return null;
}

// A physically based sky (Preetham scattering) lit by a sun that follows the
// local clock, plus sun and moon lighting for the land.
function Sky({ params }: { params: React.MutableRefObject<Params> }) {
  const sky = useMemo(() => {
    const s = new SkyShader();
    s.scale.setScalar(1500);
    const u = s.material.uniforms;
    u.turbidity.value = 3;
    u.rayleigh.value = 3;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.86;
    return s;
  }, []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const moonLight = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const moonDir = useMemo(() => dirFrom(MOON.azimuth, MOON.elevation), []);

  useEffect(
    () => () => {
      sky.geometry.dispose();
      sky.material.dispose();
    },
    [sky]
  );

  useFrame(() => {
    const p = params.current;
    dirFrom(SUN_AZIMUTH, p.elevation, dir);
    sky.material.uniforms.sunPosition.value.copy(dir);
    if (sun.current) {
      sun.current.position.copy(dir).multiplyScalar(100);
      sun.current.intensity = 1.6 * Math.max(0, p.day - 0.15);
    }
    if (moonLight.current) {
      moonLight.current.position.copy(moonDir).multiplyScalar(100);
      moonLight.current.intensity = 0.35 * (1 - p.day);
    }
    if (hemi.current) {
      timeColor(hemi.current.color, PALETTE.sky, p.day).lerp(DUSK.light, 0.6 * p.dusk);
      hemi.current.intensity = 0.6 + 0.8 * p.day;
    }
  });

  return (
    <>
      <primitive object={sky} />
      <hemisphereLight ref={hemi} args={['#5b4a6e', '#0a0d0b', 0.5]} />
      <directionalLight ref={sun} color="#ffd2a1" />
      <directionalLight ref={moonLight} color="#a9bcff" />
    </>
  );
}

// Evening colours: a deep magenta horizon fading to plum, with pink haze.
const DUSK = {
  horizon: new THREE.Color('#a3104e'),
  mid: new THREE.Color('#3e0a2c'),
  fog: new THREE.Color('#3d1631'),
  light: new THREE.Color('#b0507e'),
};

// A deep-pink sunset laid over the physically based sky in the evening.
// Per-vertex alpha keeps it strongest at the horizon and clear overhead.
function SunsetGlow({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1200, 48, 24);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 4);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = Math.max(0, pos.getY(i) / 1200);
      // Brightest toward the sunset (straight ahead), dimmer behind.
      const ahead = 0.6 + 0.4 * Math.max(0, -pos.getZ(i) / 1200);
      c.copy(DUSK.horizon).lerp(DUSK.mid, Math.min(1, h * 2.2));
      const alpha = Math.min(1, Math.exp(-h * 1.6) * 1.1) * ahead;
      colors.set([c.r, c.g, c.b, pos.getY(i) < -40 ? 0 : alpha], i * 4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (mat.current) mat.current.opacity = 0.95 * params.current.dusk;
  });
  // Drawn early among see-through things: the dome is centred on the camera,
  // so distance sorting alone would paint it over clouds and the aurora.
  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <meshBasicMaterial ref={mat} vertexColors side={THREE.BackSide} transparent depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

// The scattering model has no real night, so a deep-blue night sky fades in
// over it after sunset.
function NightSky({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1000, 32, 16);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const zenith = new THREE.Color('#050816');
    const horizon = new THREE.Color('#1a2140');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = Math.max(0, pos.getY(i) / 1000);
      c.copy(horizon).lerp(zenith, Math.pow(h, 0.6));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (mat.current) mat.current.opacity = Math.max(0, Math.min(1, 1 - params.current.day * 2.5));
  });
  // Drawn first among see-through things (see SunsetGlow).
  return (
    <mesh geometry={geometry} renderOrder={-2}>
      <meshBasicMaterial ref={mat} vertexColors side={THREE.BackSide} transparent depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

// A soft moon high on the left, visible from dusk through the night.
function Moon({ params }: { params: React.MutableRefObject<Params> }) {
  const core = useRef<THREE.SpriteMaterial>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const pos = useMemo(() => dirFrom(MOON.azimuth, MOON.elevation).multiplyScalar(500), []);
  useFrame(() => {
    const night = 1 - params.current.day;
    if (core.current) core.current.opacity = 0.95 * night;
    if (halo.current) halo.current.opacity = 0.22 * night;
  });
  return (
    <group position={pos}>
      <sprite scale={70}>
        <spriteMaterial ref={halo} map={glowTexture()} color="#c9d6ff" transparent depthWrite={false} fog={false} />
      </sprite>
      <sprite scale={16}>
        <spriteMaterial ref={core} map={glowTexture()} color="#f4f1e6" transparent depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

// Stars that come out as the sky darkens.
const STARS = NATIVE ? 220 : 450;
function Stars({ params }: { params: React.MutableRefObject<Params> }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = 0.08 + Math.random() * 1.4;
      pos[i * 3] = Math.cos(az) * Math.cos(el) * 600;
      pos[i * 3 + 1] = Math.sin(el) * 600;
      pos[i * 3 + 2] = Math.sin(az) * Math.cos(el) * 600;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const p = params.current;
    const dark = Math.max(0, 1 - p.day * 2.2);
    if (mat.current) mat.current.opacity = (0.75 + 0.15 * Math.sin(p.t * 0.7)) * dark;
  });
  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={mat}
        size={2.2}
        map={dotTexture()}
        color="#ffffff"
        transparent
        depthWrite={false}
        fog={false}
        sizeAttenuation
      />
    </points>
  );
}

// Two ranges of mountains on the horizon; distance and fog give the haze.
function Mountains({ colors }: { colors: [string, string] }) {
  const ranges = useMemo(
    () =>
      [
        { z: -175, height: 22, depth: 70, seed: 1 },
        { z: -290, height: 48, depth: 110, seed: 2 },
      ].map((r) => {
        const g = new THREE.PlaneGeometry(900, r.depth, NATIVE ? 160 : 260, 14);
        g.rotateX(-Math.PI / 2);
        const pos = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          // 0 at the front edge rising to the ridge at the back.
          const back = 0.5 - pos.getZ(i) / r.depth;
          const rise = Math.sin(Math.max(0, Math.min(1, back)) * Math.PI * 0.5);
          pos.setY(i, ridgeline(x, r.seed) * r.height * rise - 2);
        }
        g.computeVertexNormals();
        return { ...r, geometry: g };
      }),
    []
  );
  useEffect(() => () => ranges.forEach((r) => r.geometry.dispose()), [ranges]);
  return (
    <>
      {ranges.map((r) => (
        <mesh key={r.seed} geometry={r.geometry} position={[0, 0, r.z]}>
          <meshStandardMaterial color={colors[r.seed - 1]} roughness={1} />
        </mesh>
      ))}
    </>
  );
}

// Rolling hills along a valley. Three identical tiles leapfrog toward the
// camera; the ground shape repeats every tile, so the joins are seamless and
// nothing is recomputed per frame.
function Ground({ params, biome }: { params: React.MutableRefObject<Params>; biome: Biome }) {
  const tiles = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(TILE.width, TILE_LENGTH, TILE.cols, TILE.rows);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new THREE.Color(biome.ground[0]);
    const high = new THREE.Color(biome.ground[1]);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = heightIn(biome, x, z);
      pos.setY(i, y);
      // Slightly lighter on the hillsides, with a little natural variation.
      const v = Math.min(1, Math.max(0, y / 6 + 0.25 + 0.15 * Math.sin(x * 1.7 + z * 0.9)));
      c.copy(low).lerp(high, v);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [biome]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = params.current;
    // A soft glow of its own so the near ground isn't lost at dusk and night.
    mats.current.forEach((m) => m && (m.emissiveIntensity = 0.1 + 0.18 * p.day + 0.12 * p.dusk));
    tiles.current.forEach((m) => {
      if (!m) return;
      m.position.z += p.travel * dt;
      // Once a tile is fully behind the camera, send it to the far end.
      if (m.position.z - TILE_LENGTH / 2 > 12) m.position.z -= TILES * TILE_LENGTH;
    });
  });

  return (
    <>
      {Array.from({ length: TILES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            tiles.current[i] = m;
          }}
          geometry={geometry}
          position={[0, 0, -i * TILE_LENGTH]}
        >
          <meshStandardMaterial
            ref={(m: THREE.MeshStandardMaterial | null) => {
              mats.current[i] = m;
            }}
            vertexColors
            roughness={0.95}
            emissive={biome.ground[1]}
            emissiveIntensity={0.15}
          />
          <TileFlora biome={biome} seed={i + 1} />
        </mesh>
      ))}
    </>
  );
}

// Low banks of mist in the middle distance, tinted by the time of day.
function Mist({ params }: { params: React.MutableRefObject<Params> }) {
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const banks = [
    { x: -14, y: 2.2, z: -55, w: 90, h: 9 },
    { x: 18, y: 3, z: -90, w: 120, h: 12 },
    { x: 0, y: 4, z: -135, w: 180, h: 16 },
  ];
  useFrame(() => {
    const p = params.current;
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.color.copy(p.fog).lerp(new THREE.Color('#ffffff'), 0.08);
      m.opacity = 0.32 - i * 0.05;
    });
    sprites.current.forEach((s, i) => {
      if (s) s.position.x = banks[i].x + Math.sin(p.t * 0.05 + i * 2) * 6;
    });
  });
  return (
    <>
      {banks.map((b, i) => (
        <sprite
          key={i}
          ref={(s) => {
            sprites.current[i] = s;
          }}
          position={[b.x, b.y, b.z]}
          scale={[b.w, b.h, 1]}
        >
          <spriteMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={glowTexture()}
            transparent
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

// Your rhythm animal on the path ahead; before the reveal, a soft wisp of
// light floating where it will appear.
function Totem({
  animal,
  color,
  mood,
  hop,
  still,
  visible,
  params,
}: {
  animal: AnimalId | null;
  color: string;
  mood: Mood | null;
  hop: number;
  still: boolean;
  visible: boolean;
  params: React.MutableRefObject<Params>;
}) {
  const presence = useRef(visible ? 1 : 0);
  const group = useRef<THREE.Group>(null);
  const wisp = useRef<THREE.SpriteMaterial>(null);
  const wispHalo = useRef<THREE.SpriteMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const white = useMemo(() => new THREE.Color('#ffffff'), []);

  useFrame((_, rawDt) => {
    const p = params.current;
    const g = group.current;
    if (!g) return;
    presence.current = damp(presence.current, visible ? 1 : 0, 3, Math.min(rawDt, 0.05));
    g.visible = presence.current > 0.01;
    g.position.y = TOTEM[1] + (animal ? 0 : 0.8 + Math.sin(p.t * 0.9) * 0.25);
    g.rotation.y = animal ? Math.sin(p.t * 0.25) * 0.6 : 0;
    g.scale.setScalar((animal ? 1.2 : 1) * presence.current);
    const pulse = 0.85 + 0.15 * Math.sin(p.t * 1.3);
    if (wisp.current) {
      wisp.current.color.copy(p.color).lerp(white, 0.6);
      wisp.current.opacity = pulse * p.glow;
    }
    if (wispHalo.current) {
      wispHalo.current.color.copy(p.color);
      wispHalo.current.opacity = 0.45 * pulse * p.glow;
    }
    if (light.current) {
      light.current.color.copy(p.color);
      light.current.intensity = (animal ? 4 : 8) * pulse * p.glow * presence.current;
    }
  });

  return (
    <group ref={group} position={TOTEM}>
      {animal ? (
        <Animal animal={animal} color={color} mood={mood} hop={hop} still={still} />
      ) : (
        <>
          <sprite scale={5}>
            <spriteMaterial ref={wispHalo} map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <sprite scale={1.2}>
            <spriteMaterial ref={wisp} map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </>
      )}
      <pointLight ref={light} distance={14} decay={1.6} />
    </group>
  );
}

function Scene({
  animal,
  mood,
  hop,
  mode,
  live,
}: {
  animal: AnimalId | null;
  mood: Mood | null;
  hop: number;
  mode: WorldMode;
  live: React.MutableRefObject<Live>;
}) {
  // The totem is the hero only on open, scenic screens. It steps back for the
  // reveal (which has its own close-up emblem), the reset (the breathing orb is
  // the focus) and dense screens, where it would sit behind text.
  const showTotem = ['landing', 'quiz', 'reading', 'home'].includes(mode);
  // Everyone shares the valley until the reveal; then it becomes your
  // animal's world.
  const biome = biomeFor(animal);
  const params = useRef<Params>({
    travel: 0,
    glow: STATIONS[live.current.mode].glow,
    t: 0,
    color: live.current.tint.clone(),
    elevation: sunElevation(live.current.hour),
    day: daylight(sunElevation(live.current.hour)),
    dusk: sunsetGlow(live.current.hour, sunElevation(live.current.hour)),
    fog: new THREE.Color(BG),
  });
  return (
    <>
      <fog attach="fog" args={[BG, 25, 420]} />
      <Rig live={live} params={params} />
      <Sky params={params} />
      <SunsetGlow params={params} />
      <NightSky params={params} />
      <Stars params={params} />
      <Moon params={params} />
      <Clouds params={params} />
      <SunGlare params={params} />
      <ShootingStar params={params} />
      {biome.aurora && <Aurora params={params} />}
      <Mountains colors={biome.mountains} />
      <Ground params={params} biome={biome} />
      {biome.water && <Water biome={biome} params={params} />}
      <GrassClock params={params} />
      <Mist params={params} />
      <Particles key={biome.id} biome={biome} params={params} />
      <Totem
        animal={animal}
        color={'#' + live.current.tint.getHexString()}
        mood={mood}
        hop={hop}
        still={live.current.still}
        visible={showTotem}
        params={params}
      />
    </>
  );
}

// In "demand" mode, render a few frames after a change so damped values settle.
function Settle({ deps }: { deps: unknown[] }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    const id = setTimeout(() => invalidate(), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

export default function World({
  mode,
  animal,
  tint = T.accent,
  mood = null,
  hop = 0,
  still = false,
}: {
  mode: WorldMode;
  animal: AnimalId | null;
  tint?: string;
  // Today's check-in, so the animal moves like you feel.
  mood?: Mood | null;
  hop?: number;
  still?: boolean;
}) {
  const hour = useLocalHour();
  const live = useLive(mode, tint, still, hour);
  useDeviceTilt(!still);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // Gentle parallax from the pointer on web.
  useEffect(() => {
    if (NATIVE || still) return;
    const g: any = globalThis;
    const onMove = (e: PointerEvent) => {
      live.current.pointer.x = (e.clientX / g.innerWidth) * 2 - 1;
      live.current.pointer.y = -((e.clientY / g.innerHeight) * 2 - 1);
    };
    g.addEventListener?.('pointermove', onMove);
    return () => g.removeEventListener?.('pointermove', onMove);
  }, [live, still]);

  const frameloop = !active ? 'never' : still ? 'demand' : 'always';

  return (
    <View pointerEvents="none" style={styles.fill}>
      <GLBoundary fallback={<Atmosphere style={StyleSheet.absoluteFill} pulse={!still} />}>
        <Canvas
          style={StyleSheet.absoluteFill as any}
          frameloop={frameloop}
          dpr={NATIVE ? 1 : [1, 1.5]}
          gl={{ antialias: !NATIVE, powerPreference: 'low-power' } as any}
          camera={{ position: STATIONS[mode].camera, fov: 55, near: 0.1, far: 3000 }}
        >
          <Scene animal={animal} mood={mood} hop={hop} mode={mode} live={live} />
          {/* Redraw when anything visible changes, including the hour. */}
          {still && <Settle deps={[mode, tint, animal, hour]} />}
        </Canvas>
      </GLBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: BG },
});
