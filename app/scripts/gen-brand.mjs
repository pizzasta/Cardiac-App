// Renders the Circadia brand images (icon, adaptive icon, splash, favicon,
// Android notification icon) to assets/*.png with Playwright.
// Run: node scripts/gen-brand.mjs
// Mark: a glowing hot-pink sun half-set behind a soft rolling horizon, on a
// dusky plum-to-black sky. No text, no fine detail, so it reads at 29px.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PW = process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (f) => path.join(root, 'assets', f);

const BG = '#08080A';
const PINK = '#FF2E7E';
const GLOW = '#FF3B5C';

// Horizon: a gentle hill whose crest sits slightly above the sun's centre.
// All coordinates in a 1024 x 1024 box.
const HILL = 'M -40 690 C 220 560, 420 540, 560 556 C 760 578, 900 640, 1064 650';
const SUN = { cx: 512, cy: 600, r: 250 };

const defs = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG}"/>
      <stop offset="0.42" stop-color="#1A0A18"/>
      <stop offset="0.62" stop-color="#3A0E2C"/>
      <stop offset="0.66" stop-color="#4A1034"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16080F"/>
      <stop offset="1" stop-color="${BG}"/>
    </linearGradient>
    <radialGradient id="halo" cx="${SUN.cx}" cy="${SUN.cy}" r="${SUN.r * 2}" gradientUnits="userSpaceOnUse">
      <stop offset="0.45" stop-color="${GLOW}" stop-opacity="0.55"/>
      <stop offset="0.7" stop-color="${GLOW}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${GLOW}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF5C9A"/>
      <stop offset="0.6" stop-color="${PINK}"/>
      <stop offset="1" stop-color="${GLOW}"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${PINK}" stop-opacity="0"/>
      <stop offset="0.3" stop-color="${PINK}" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="#FF7AAE" stop-opacity="1"/>
      <stop offset="0.7" stop-color="${PINK}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${PINK}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="aboveHill">
      <path d="${HILL} L 1064 -40 L -40 -40 Z"/>
    </clipPath>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>`;

// The mark itself (sun + horizon rim), optionally with the full sky/ground.
function scene({ sky = true, ground = true, halo = true } = {}) {
  return `
    ${sky ? `<rect x="0" y="0" width="1024" height="1024" fill="url(#sky)"/>` : ''}
    <g clip-path="url(#aboveHill)">
      ${halo ? `<circle cx="${SUN.cx}" cy="${SUN.cy}" r="${SUN.r * 2}" fill="url(#halo)"/>` : ''}
      <circle cx="${SUN.cx}" cy="${SUN.cy}" r="${SUN.r}" fill="url(#sun)"/>
    </g>
    ${ground ? `<path d="${HILL} L 1064 1064 L -40 1064 Z" fill="url(#ground)"/>` : ''}
    <path d="${HILL}" fill="none" stroke="url(#rim)" stroke-width="22" filter="url(#blur)" opacity="0.9"/>
    <path d="${HILL}" fill="none" stroke="url(#rim)" stroke-width="9" stroke-linecap="round"/>`;
}

const svg = (size, body, extraDefs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${extraDefs}${body}</svg>`;

const page = (w, h, inner, bg = 'transparent') => `<!doctype html><html><head><style>
  html,body{margin:0;padding:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden}
  .c{width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center}
  svg{display:block}
</style></head><body><div class="c">${inner}</div></body></html>`;

// Adaptive / splash mark: no sky, horizon rim fades out at the edges, and the
// whole thing scaled into the centre so it sits inside the safe zone.
// The mark spans roughly x 140..884 and y 290..700 before scaling.
function centredMark(scale) {
  const t = 512 - 512 * scale;
  // Shift up so the visual centre (sun ~ y 470) lands in the middle.
  const dy = (512 - 520) * scale;
  return `<g transform="translate(${t} ${t + dy}) scale(${scale})">${scene({ sky: false, ground: false })}</g>`;
}

// Notification icon: pure white silhouette on transparent (Android tints it).
// Bold half-disc plus a separate horizon bar so it reads at 24dp.
const notifSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <path d="M 18 58 A 30 30 0 0 1 78 58 Z" fill="#fff"/>
  <rect x="8" y="65" width="80" height="8" rx="4" fill="#fff"/>
</svg>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const p = await ctx.newPage();

async function shot(file, w, h, html, transparent) {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(html);
  await p.screenshot({ path: out(file), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(`wrote assets/${file} (${w}x${h})`);
}

// 1. App icon: opaque full scene.
await shot('icon.png', 1024, 1024, page(1024, 1024, svg(1024, scene()), BG), false);

// 2. Adaptive icon foreground: transparent, mark within central ~66%.
await shot('adaptive-icon.png', 1024, 1024, page(1024, 1024, svg(1024, centredMark(0.66))), true);

// 3. Splash: centred mark on BG; resizeMode "contain" scales the whole image,
// so render a square with the mark at a modest size.
await shot('splash.png', 1284, 2778, page(1284, 2778, svg(1284, centredMark(0.62)), BG), false);

// 4. Favicon: opaque full scene, small.
await shot('favicon.png', 48, 48, page(48, 48, svg(48, scene()), BG), false);

// 5. Android notification icon.
await shot('notification-icon.png', 96, 96, page(96, 96, notifSvg), true);

await browser.close();
