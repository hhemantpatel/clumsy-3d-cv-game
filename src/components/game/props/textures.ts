import * as THREE from 'three';
import { rng } from './kit';

/**
 * Small procedural canvas textures owned by the house / props.
 * Each is generated once, cached, and used with repeat = 1 (geometry carries world-space UVs),
 * so nothing ever mutates a shared texture's repeat/offset (except the monitor's own code texture).
 */

const cache = new Map<string, THREE.CanvasTexture>();

function canvasTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** Horizontal lap siding: 8 boards per tile (tile = 1.6 m -> 0.2 m boards). */
export function sidingTexture() {
  return canvasTex('siding', 256, 256, (ctx) => {
    const r = rng(7);
    const rows = 8;
    const bh = 256 / rows;
    for (let i = 0; i < rows; i++) {
      const y = i * bh;
      const shade = Math.floor(r() * 14) - 7;
      ctx.fillStyle = `rgb(${196 + shade}, ${138 + shade}, ${92 + shade})`;
      ctx.fillRect(0, y, 256, bh);
      // grain
      for (let g = 0; g < 10; g++) {
        ctx.strokeStyle = `rgba(110, 62, 30, ${0.05 + r() * 0.08})`;
        ctx.lineWidth = 1;
        const gy = y + 3 + r() * (bh - 8);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(256, gy + (r() * 2 - 1));
        ctx.stroke();
      }
      // lap shadow at the bottom of each board + highlight at the top
      const grad = ctx.createLinearGradient(0, y + bh - 9, 0, y + bh);
      grad.addColorStop(0, 'rgba(60, 30, 10, 0)');
      grad.addColorStop(1, 'rgba(60, 30, 10, 0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y + bh - 9, 256, 9);
      ctx.fillStyle = 'rgba(255, 230, 190, 0.25)';
      ctx.fillRect(0, y, 256, 2);
    }
  });
}

/** Honey-oak floor boards, staggered butt joints. Tile = 2.4 m, 8 boards per tile. */
export function floorTexture() {
  return canvasTex('floor', 512, 512, (ctx) => {
    const r = rng(11);
    const rows = 8;
    const bh = 512 / rows;
    for (let i = 0; i < rows; i++) {
      const y = i * bh;
      let x = -Math.floor(r() * 300);
      while (x < 512) {
        const len = 220 + r() * 200;
        const shade = Math.floor(r() * 24) - 12;
        ctx.fillStyle = `rgb(${186 + shade}, ${130 + shade}, ${80 + shade * 0.6})`;
        ctx.fillRect(x, y, len, bh);
        for (let g = 0; g < 7; g++) {
          ctx.strokeStyle = `rgba(105, 60, 25, ${0.06 + r() * 0.1})`;
          ctx.lineWidth = 1 + r();
          const gy = y + 4 + r() * (bh - 8);
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.bezierCurveTo(x + len * 0.3, gy + r() * 4 - 2, x + len * 0.7, gy + r() * 4 - 2, x + len, gy);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(70, 38, 15, 0.7)';
        ctx.fillRect(x + len - 2, y, 2, bh);
        x += len;
      }
      ctx.fillStyle = 'rgba(70, 38, 15, 0.75)';
      ctx.fillRect(0, y + bh - 2, 512, 2);
    }
  });
}

/** Rustic fieldstone with mortar joints. Tile = 1.2 m. */
export function stoneTexture() {
  return canvasTex('fieldstone', 256, 256, (ctx) => {
    const r = rng(23);
    ctx.fillStyle = '#9a9184';
    ctx.fillRect(0, 0, 256, 256);
    const rows = 6;
    const rh = 256 / rows;
    for (let i = 0; i < rows; i++) {
      let x = i % 2 === 0 ? 0 : -24;
      while (x < 256) {
        const w = 38 + r() * 34;
        const tone = Math.floor(r() * 40);
        ctx.fillStyle = `rgb(${128 + tone}, ${120 + tone}, ${108 + tone})`;
        const rx = x + 2;
        const ry = i * rh + 2;
        const rw = w - 4;
        const rhh = rh - 4;
        const rad = 7;
        ctx.beginPath();
        ctx.moveTo(rx + rad, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + rhh, rad);
        ctx.arcTo(rx + rw, ry + rhh, rx, ry + rhh, rad);
        ctx.arcTo(rx, ry + rhh, rx, ry, rad);
        ctx.arcTo(rx, ry, rx + rw, ry, rad);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(rx + 4, ry + 3, rw - 8, 3);
        x += w;
      }
    }
  });
}

/** Dark IDE screen with syntax-coloured code lines (scrolls via .offset.y in Desk). */
export function codeScreenTexture() {
  return canvasTex('code', 512, 512, (ctx) => {
    const r = rng(42);
    ctx.fillStyle = '#16192a';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#1d2136';
    ctx.fillRect(0, 0, 40, 512);
    const palette = ['#f472b6', '#7dd3fc', '#86efac', '#fcd34d', '#c4b5fd', '#fdba74', '#e2e8f0'];
    const lineH = 16;
    for (let i = 0; i < 512 / lineH; i++) {
      const y = i * lineH + 5;
      ctx.fillStyle = '#475569';
      ctx.fillRect(12, y + 2, 16, 4);
      let x = 52 + Math.floor(r() * 4) * 22;
      if (r() < 0.12) continue; // blank line
      const tokens = 1 + Math.floor(r() * 5);
      for (let t = 0; t < tokens && x < 490; t++) {
        const w = 18 + r() * 70;
        ctx.fillStyle = palette[Math.floor(r() * palette.length)];
        ctx.fillRect(x, y, w, 7);
        x += w + 8;
      }
    }
  });
}

/** Framed-certificate paper. */
export function certificateTexture() {
  return canvasTex('certificate', 256, 192, (ctx) => {
    ctx.fillStyle = '#fbf3df';
    ctx.fillRect(0, 0, 256, 192);
    ctx.strokeStyle = '#b8862f';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 172);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, 216, 152);
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(68, 38, 120, 12);
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(48, 66, 160, 5);
    ctx.fillRect(58, 80, 140, 5);
    ctx.fillRect(78, 94, 100, 5);
    ctx.fillRect(40, 146, 60, 3);
    ctx.fillRect(156, 146, 60, 3);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(128, 136, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e6b34a';
    ctx.beginPath();
    ctx.arc(128, 136, 9, 0, Math.PI * 2);
    ctx.fill();
  });
}
