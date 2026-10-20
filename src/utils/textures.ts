import * as THREE from 'three';

// Procedural PBR Texture Generator using HTML5 Canvas
// Generates high-resolution diffuse, roughness, and bump maps with zero external downloads

class TextureGenerator {
  private cache: Map<string, THREE.CanvasTexture> = new Map();

  // 1. Rich Hardwood Planks Texture (Oak / Walnut)
  public getWoodPlanks(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
    if (this.cache.has('wood_diffuse') && this.cache.has('wood_roughness')) {
      return {
        map: this.cache.get('wood_diffuse')!,
        roughnessMap: this.cache.get('wood_roughness')!,
      };
    }

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = size;
    rCanvas.height = size;
    const rCtx = rCanvas.getContext('2d')!;

    // Plank background
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#666666';
    rCtx.fillRect(0, 0, size, size);

    const plankCount = 8;
    const plankHeight = size / plankCount;

    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;
      // Slight plank shade variation
      const shade = 10 + Math.floor(Math.random() * 20);
      ctx.fillStyle = `rgb(${69 + shade}, ${26 + (shade * 0.4)}, ${3 + (shade * 0.2)})`;
      ctx.fillRect(0, y, size, plankHeight - 3);

      // Wood grain lines
      for (let g = 0; g < 45; g++) {
        const gy = y + Math.random() * plankHeight;
        const alpha = 0.08 + Math.random() * 0.12;
        ctx.strokeStyle = `rgba(30, 10, 0, ${alpha})`;
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(
          size * 0.3, gy + (Math.random() * 8 - 4),
          size * 0.7, gy + (Math.random() * 8 - 4),
          size, gy + (Math.random() * 6 - 3)
        );
        ctx.stroke();
      }

      // Dark seam between planks
      ctx.fillStyle = 'rgba(15, 5, 0, 0.85)';
      ctx.fillRect(0, y + plankHeight - 3, size, 3);

      rCtx.fillStyle = 'rgba(200, 200, 200, 0.4)';
      rCtx.fillRect(0, y + plankHeight - 3, size, 3);
    }

    const diffuse = new THREE.CanvasTexture(canvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.RepeatWrapping;

    this.cache.set('wood_diffuse', diffuse);
    this.cache.set('wood_roughness', roughness);

    return { map: diffuse, roughnessMap: roughness };
  }

  // 2. Multi-Toned Lush Lawn Grass Texture
  public getGrassTexture(): THREE.CanvasTexture {
    if (this.cache.has('grass')) return this.cache.get('grass')!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base emerald green
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, size, size);

    // Multi-shade blade noise
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const shade = Math.random();

      if (shade > 0.6) {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.35)'; // Lime blade highlight
      } else if (shade > 0.3) {
        ctx.fillStyle = 'rgba(21, 128, 61, 0.4)';  // Deep forest shadow
      } else {
        ctx.fillStyle = 'rgba(134, 239, 172, 0.25)'; // Golden sunlit tip
      }

      ctx.fillRect(x, y, 2, 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('grass', tex);
    return tex;
  }

  // 3. Tactile Fabric Weave Bump Map
  public getFabricBump(): THREE.CanvasTexture {
    if (this.cache.has('fabric')) return this.cache.get('fabric')!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Cross-stitch thread pattern
    for (let x = 0; x < size; x += 4) {
      for (let y = 0; y < size; y += 4) {
        const bright = ((x + y) % 8 === 0) ? '#a0a0a0' : '#606060';
        ctx.fillStyle = bright;
        ctx.fillRect(x, y, 3, 3);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    this.cache.set('fabric', tex);
    return tex;
  }

  // 4. Natural Flagstone Slate Texture
  public getSlateStone(): THREE.CanvasTexture {
    if (this.cache.has('stone')) return this.cache.get('stone')!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const dark = Math.random() > 0.5;
      ctx.fillStyle = dark ? 'rgba(30, 41, 59, 0.15)' : 'rgba(203, 213, 225, 0.2)';
      ctx.fillRect(x, y, 3, 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('stone', tex);
    return tex;
  }

  // 5. Stylized Water Normal Map
  public getWaterNormal(): THREE.CanvasTexture {
    if (this.cache.has('water')) return this.cache.get('water')!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Perlin-style soft water ripples
    ctx.fillStyle = '#8080ff'; // Flat normal
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 15 + Math.random() * 35;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(180, 140, 255, 0.3)');
      grad.addColorStop(1, 'rgba(128, 128, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 18);
    this.cache.set('water', tex);
    return tex;
  }

  // 6. Feathered Soft Radial Contact Shadow Blob
  public getSoftContactShadow(): THREE.CanvasTexture {
    if (this.cache.has('contact_shadow')) return this.cache.get('contact_shadow')!;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.46;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.88)');
    grad.addColorStop(0.35, 'rgba(2, 6, 23, 0.65)');
    grad.addColorStop(0.7, 'rgba(2, 6, 23, 0.20)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set('contact_shadow', tex);
    return tex;
  }
}

export const textureGen = new TextureGenerator();
