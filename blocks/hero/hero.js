/**
 * Shader-style hero (vanilla port of mesh + motion showcase).
 * Authored content stays in markup: h1, paragraphs, buttons, optional picture.
 * Optional eyebrow: <p class="hero-eyebrow">…</p>
 * Gradient headline line: <span class="hero-accent">…</span> inside h1
 */

const BRAND = {
  bg: '#000000',
  blue: [29, 155, 240],
  blueDeep: [26, 140, 216],
  surface: [22, 24, 28],
  white: [255, 255, 255],
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function injectFilters(svgNS) {
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'hero-filters');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <defs>
      <filter id="hero-glass-effect" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.25"/>
        <feColorMatrix type="matrix"
          values="1 0 0 0 0.02  0 1 0 0 0.02  0 0 1 0 0.04  0 0 0 0.88 0"/>
      </filter>
      <filter id="hero-gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feColorMatrix in="blur" mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey"/>
        <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
      </filter>
      <filter id="hero-text-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <linearGradient id="hero-accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#1d9bf0"/>
        <stop offset="100%" stop-color="#e7e9ea"/>
      </linearGradient>
    </defs>`;
  return svg;
}

function createMeshCanvas(className) {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function resizeCanvas(canvas, wrapper) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = wrapper.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function initMeshAnimation(hero, meshCanvas, wireCanvas) {
  if (prefersReducedMotion()) return () => {};

  const meshCtx = meshCanvas.getContext('2d');
  const wireCtx = wireCanvas.getContext('2d');
  let running = true;
  let active = false;

  const blobs = [
    {
      ox: 0.25, oy: 0.35, r: 0.42, rgb: BRAND.blue, phase: 0,
    },
    {
      ox: 0.72, oy: 0.28, r: 0.38, rgb: BRAND.blueDeep, phase: 1.2,
    },
    {
      ox: 0.55, oy: 0.72, r: 0.45, rgb: BRAND.surface, phase: 2.4,
    },
    {
      ox: 0.15, oy: 0.78, r: 0.35, rgb: BRAND.white, phase: 3.1,
    },
  ];

  const onEnter = () => { active = true; hero.dataset.active = 'true'; };
  const onLeave = () => { active = false; hero.dataset.active = 'false'; };
  hero.addEventListener('mouseenter', onEnter);
  hero.addEventListener('mouseleave', onLeave);

  const observer = new IntersectionObserver((entries) => {
    running = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0.05 });
  observer.observe(hero);

  const drawMesh = (w, h, t) => {
    if (!meshCtx) return;
    const speed = active ? 1.4 : 1;
    meshCtx.fillStyle = BRAND.bg;
    meshCtx.fillRect(0, 0, w, h);
    blobs.forEach((b, i) => {
      const x = (b.ox + Math.sin(t * 0.00035 * speed + b.phase) * 0.12) * w;
      const y = (b.oy + Math.cos(t * 0.00028 * speed + b.phase + i) * 0.1) * h;
      const radius = b.r * Math.min(w, h);
      const [r, g, bVal] = b.rgb;
      const grad = meshCtx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `rgba(${r},${g},${bVal},${i === 3 ? 0.08 : 0.45})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      meshCtx.globalCompositeOperation = i === 3 ? 'screen' : 'lighter';
      meshCtx.fillStyle = grad;
      meshCtx.fillRect(0, 0, w, h);
    });
    meshCtx.globalCompositeOperation = 'source-over';
  };

  const drawWire = (w, h, t) => {
    if (!wireCtx) return;
    wireCtx.clearRect(0, 0, w, h);
    wireCtx.strokeStyle = 'rgba(29, 155, 240, 0.12)';
    wireCtx.lineWidth = 1;
    const step = 48;
    const offset = (t * 0.02) % step;
    for (let x = -step; x < w + step; x += step) {
      wireCtx.beginPath();
      wireCtx.moveTo(x + offset, 0);
      wireCtx.lineTo(x + offset, h);
      wireCtx.stroke();
    }
    for (let y = -step; y < h + step; y += step) {
      wireCtx.beginPath();
      wireCtx.moveTo(0, y + offset * 0.6);
      wireCtx.lineTo(w, y + offset * 0.6);
      wireCtx.stroke();
    }
  };

  let raf = 0;
  const loop = (t) => {
    if (running) {
      const { width, height } = resizeCanvas(meshCanvas, hero);
      resizeCanvas(wireCanvas, hero);
      drawMesh(width, height, t);
      drawWire(width, height, t);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const onResize = () => {
    resizeCanvas(meshCanvas, hero);
    resizeCanvas(wireCanvas, hero);
  };
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    hero.removeEventListener('mouseenter', onEnter);
    hero.removeEventListener('mouseleave', onLeave);
    window.removeEventListener('resize', onResize);
  };
}

function buildOrbit() {
  const orbit = document.createElement('div');
  orbit.className = 'hero-orbit';
  orbit.setAttribute('aria-hidden', 'true');
  orbit.innerHTML = `
    <div class="hero-orbit-pulse"></div>
    <svg class="hero-orbit-text" viewBox="0 0 100 100">
      <defs>
        <path id="hero-orbit-path" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"/>
      </defs>
      <text>
        <textPath href="#hero-orbit-path" startOffset="0%">
          Prism · Edge Delivery · Portfolio · Royincog ·
        </textPath>
      </text>
    </svg>`;
  return orbit;
}

function wrapActions(inner) {
  const wrappers = [...inner.querySelectorAll('p.button-wrapper')];
  if (wrappers.length < 2) return;
  const group = document.createElement('div');
  group.className = 'hero-actions hero-actions--gooey';
  const first = wrappers[0];
  first.parentNode.insertBefore(group, first);
  wrappers.forEach((w) => group.append(w));
}

export default function decorate(block) {
  const svgNS = 'http://www.w3.org/2000/svg';
  block.classList.add('hero-shader');

  const inner = document.createElement('div');
  inner.className = 'hero-inner';
  [...block.childNodes].forEach((node) => inner.append(node));

  const picture = inner.querySelector('picture');
  if (picture) picture.classList.add('hero-shader-photo');

  block.append(createMeshCanvas('hero-mesh'));
  block.append(createMeshCanvas('hero-mesh hero-mesh--wire'));
  block.append(injectFilters(svgNS));
  block.append(inner);

  const eyebrow = inner.querySelector(':scope > p.hero-eyebrow');
  if (eyebrow) {
    const badge = document.createElement('div');
    badge.className = 'hero-eyebrow';
    badge.innerHTML = eyebrow.innerHTML;
    eyebrow.replaceWith(badge);
  }

  wrapActions(inner);
  block.append(buildOrbit());

  const mesh = block.querySelector('canvas.hero-mesh:not(.hero-mesh--wire)');
  const wire = block.querySelector('canvas.hero-mesh--wire');
  let teardown = () => {};
  if (mesh && wire) {
    teardown = initMeshAnimation(block, mesh, wire);
  }

  requestAnimationFrame(() => {
    block.classList.add('hero-ready');
  });

  block.dataset.shaderInit = 'true';
  return teardown;
}
