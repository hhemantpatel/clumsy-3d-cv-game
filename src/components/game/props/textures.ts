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

/** Horizontal lap siding: 8 boards per tile (tile = 1.6 m -> 0.2 m boards) with tactile cartoon bevels and woodgrain. */
export function sidingTexture() {
  return canvasTex('siding_v2', 512, 512, (ctx) => {
    const r = rng(103);
    const rows = 8;
    const bh = 512 / rows;

    // Base background tone
    ctx.fillStyle = '#b87848';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < rows; i++) {
      const y = i * bh;
      const shade = Math.floor(r() * 18) - 9;
      // Warm storybook cedar / amber plank tones
      ctx.fillStyle = `rgb(${204 + shade}, ${145 + shade}, ${96 + Math.round(shade * 0.7)})`;
      ctx.fillRect(0, y, 512, bh);

      // Stylized hand-hewn subtle undulating grain whorls
      const grainCount = 9;
      for (let g = 0; g < grainCount; g++) {
        ctx.strokeStyle = `rgba(95, 48, 18, ${0.05 + r() * 0.09})`;
        ctx.lineWidth = 1.5 + r() * 1.5;
        const gy = y + 6 + r() * (bh - 14);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        const cp1x = 128 + (r() - 0.5) * 40;
        const cp1y = gy + (r() - 0.5) * 6;
        const cp2x = 384 + (r() - 0.5) * 40;
        const cp2y = gy + (r() - 0.5) * 6;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, 512, gy + (r() * 3 - 1.5));
        ctx.stroke();
      }

      // Storybook wooden pegs / nails at plank ends
      for (const px of [24 + r() * 10, 488 - r() * 10]) {
        if (r() > 0.3) {
          const py = y + bh / 2 + (r() - 0.5) * 4;
          // Peg shadow & highlight
          ctx.fillStyle = 'rgba(50, 22, 8, 0.45)';
          ctx.beginPath();
          ctx.arc(px, py + 1, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(245, 215, 175, 0.55)';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Chunky 3D lap drop shadow at the bottom of each plank
      const shadowH = 14;
      const dropGrad = ctx.createLinearGradient(0, y + bh - shadowH, 0, y + bh);
      dropGrad.addColorStop(0, 'rgba(45, 20, 8, 0)');
      dropGrad.addColorStop(0.7, 'rgba(45, 20, 8, 0.45)');
      dropGrad.addColorStop(1, 'rgba(45, 20, 8, 0.72)');
      ctx.fillStyle = dropGrad;
      ctx.fillRect(0, y + bh - shadowH, 512, shadowH);

      // Deep groove line at the joint
      ctx.fillStyle = 'rgba(35, 14, 5, 0.85)';
      ctx.fillRect(0, y + bh - 2, 512, 2.5);

      // Warm sunlit bevel highlight at the top of the plank
      const hiGrad = ctx.createLinearGradient(0, y, 0, y + 6);
      hiGrad.addColorStop(0, 'rgba(255, 242, 215, 0.55)');
      hiGrad.addColorStop(1, 'rgba(255, 242, 215, 0)');
      ctx.fillStyle = hiGrad;
      ctx.fillRect(0, y, 512, 6);
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

/** Stylized cartoon cobblestone / riverstone foundation with pillowed 3D relief. Tile = 1.2 m. */
export function stoneTexture() {
  return canvasTex('fieldstone_v2', 512, 512, (ctx) => {
    const r = rng(88);
    // Dark earthy mortar joint background
    ctx.fillStyle = '#4c453d';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 6;
    const rh = 512 / rows;

    for (let i = 0; i < rows; i++) {
      // Offset alternating rows by half stone width
      let x = (i % 2 === 0 ? 0 : -45) - 30;
      while (x < 550) {
        const w = 72 + r() * 48;
        const rx = x + 4;
        const ry = i * rh + 4;
        const rw = w - 8;
        const rhh = rh - 8;
        const rad = 14;

        if (rw > 12 && rhh > 12) {
          // Palette: warm slate, riverbed buff, subtle mossy stone
          const tone = Math.floor(r() * 32);
          const mossTint = r() > 0.7 ? 8 : 0;
          const baseR = 140 + tone;
          const baseG = 132 + tone + mossTint;
          const baseB = 120 + tone;

          // Pillowed 3D volume gradient for each stone
          const stoneGrad = ctx.createRadialGradient(
            rx + rw * 0.38,
            ry + rhh * 0.32,
            rad * 0.4,
            rx + rw * 0.5,
            ry + rhh * 0.5,
            rw * 0.65
          );
          stoneGrad.addColorStop(0, `rgb(${baseR + 28}, ${baseG + 28}, ${baseB + 24})`);
          stoneGrad.addColorStop(0.65, `rgb(${baseR}, ${baseG}, ${baseB})`);
          stoneGrad.addColorStop(1, `rgb(${baseR - 35}, ${baseG - 35}, ${baseB - 32})`);

          // Rounded pebble path
          ctx.beginPath();
          ctx.roundRect(rx, ry, rw, rhh, rad);
          ctx.fillStyle = stoneGrad;
          ctx.fill();

          // Ambient occlusion drop shadow under the stone inside mortar
          ctx.strokeStyle = 'rgba(25, 20, 16, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Soft sunlit crown highlight on top rim of the pebble
          ctx.beginPath();
          ctx.roundRect(rx + 5, ry + 4, rw - 10, rhh * 0.35, [rad * 0.7, rad * 0.7, 0, 0]);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fill();
        }

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
