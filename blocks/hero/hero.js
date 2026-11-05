/**
 * Paper-shader-style hero (vanilla). No React — mimics MeshGradient + PulsingBorder flow.
 *
 * Authored markup: h1, paragraphs, buttons, optional picture.
 * Eyebrow: <p class="hero-eyebrow">…</p>
 * Headline (three lines like ShaderShowcase):
 *   <span class="hero-gradient">Beautiful</span>
 *   <span class="hero-display">Shader</span>
 *   <span class="hero-soft">Experiences</span>
 * Legacy: <span class="hero-accent">…</span> maps to .hero-gradient
 *
 * Colors are read from base.css tokens at runtime.
 */

function parseRgb(value) {
  const match = `${value}`.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!match) return [15, 20, 25];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function readToken(el, name) {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  el.append(probe);
  const rgb = parseRgb(getComputedStyle(probe).color);
  probe.remove();
  return rgb;
}

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
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3"/>
        <feColorMatrix type="matrix"
          values="1 0 0 0 0.02  0 1 0 0 0.02  0 0 1 0 0.05  0 0 0 0.9 0"/>
      </filter>
      <filter id="hero-text-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <linearGradient id="hero-accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="var(--hero-fg)"/>
        <stop offset="30%" stop-color="var(--primary)"/>
        <stop offset="70%" stop-color="var(--chart-3)"/>
        <stop offset="100%" stop-color="var(--hero-fg)"/>
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

function paintRibbon(ctx, x, y, rx, ry, rot, rgb, alpha) {
  const [r, g, b] = rgb;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(0.45, `rgba(${r},${g},${b},${alpha * 0.55})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function initFlowAnimation(hero, meshCanvas) {
  if (prefersReducedMotion()) return () => {};

  const ctx = meshCanvas.getContext('2d');
  const colors = {
    bg: readToken(hero, '--hero-bg'),
    primary: readToken(hero, '--primary'),
    primaryDeep: readToken(hero, '--primary-hover'),
    depth: readToken(hero, '--accent-foreground'),
    warm: readToken(hero, '--chart-3'),
    sheen: readToken(hero, '--hero-fg'),
  };

  const blobs = [
    {
      ox: 0.18, oy: 0.42, rx: 0.58, ry: 0.5, rot: -0.35, alpha: 0.82, rgb: colors.primary, phase: 0,
    },
    {
      ox: 0.78, oy: 0.28, rx: 0.52, ry: 0.44, rot: 0.25, alpha: 0.72, rgb: colors.primaryDeep, phase: 1.1,
    },
    {
      ox: 0.52, oy: 0.68, rx: 0.65, ry: 0.4, rot: -0.55, alpha: 0.68, rgb: colors.warm, phase: 2.3,
    },
    {
      ox: 0.35, oy: 0.22, rx: 0.48, ry: 0.38, rot: 0.1, alpha: 0.5, rgb: colors.depth, phase: 3.5,
    },
    {
      ox: 0.62, oy: 0.45, rx: 0.38, ry: 0.3, rot: -0.2, alpha: 0.14, rgb: colors.sheen, phase: 4.2,
    },
    {
      ox: 0.42, oy: 0.55, rx: 0.55, ry: 0.35, rot: -0.45, alpha: 0.22, rgb: colors.warm, phase: 5.1,
    },
    {
      ox: 0.68, oy: 0.48, rx: 0.45, ry: 0.32, rot: 0.15, alpha: 0.18, rgb: colors.primary, phase: 1.7,
    },
  ];

  let running = true;
  let active = false;
  let sizedW = 0;
  let sizedH = 0;

  const onEnter = () => { active = true; hero.dataset.active = 'true'; };
  const onLeave = () => { active = false; hero.dataset.active = 'false'; };
  hero.addEventListener('mouseenter', onEnter);
  hero.addEventListener('mouseleave', onLeave);

  const observer = new IntersectionObserver((entries) => {
    running = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0.05 });
  observer.observe(hero);

  const syncSize = () => {
    const { width, height } = hero.getBoundingClientRect();
    if (width === sizedW && height === sizedH && meshCanvas.width > 2) {
      return { w: meshCanvas.width, h: meshCanvas.height };
    }
    sizedW = width;
    sizedH = height;
    const scale = 0.32;
    const w = Math.max(2, Math.floor(width * scale));
    const h = Math.max(2, Math.floor(height * scale));
    meshCanvas.width = w;
    meshCanvas.height = h;
    return { w, h };
  };

  const draw = (time) => {
    if (!ctx) return;
    const { w, h } = syncSize();
    const speed = active ? 1.25 : 1;
    const t = time * 0.00024 * speed;
    const [br, bg, bb] = colors.bg;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgb(${br},${bg},${bb})`;
    ctx.fillRect(0, 0, w, h);

    blobs.forEach((blob, i) => {
      const x = (blob.ox + Math.sin(t + blob.phase) * 0.032) * w;
      const y = (blob.oy + Math.cos(t * 0.88 + blob.phase) * 0.028) * h;
      const rx = blob.rx * w;
      const ry = blob.ry * h;
      const rot = blob.rot + Math.sin(t * 0.5 + blob.phase) * 0.04;
      ctx.globalCompositeOperation = i === blobs.length - 1 ? 'screen' : 'lighter';
      paintRibbon(ctx, x, y, rx, ry, rot, blob.rgb, blob.alpha);
    });
    ctx.globalCompositeOperation = 'source-over';
  };

  let raf = 0;
  const loop = (time) => {
    if (running) draw(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const onResize = () => {
    sizedW = 0;
    sizedH = 0;
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

function wrapActions(inner) {
  const wrappers = [...inner.querySelectorAll('p.button-wrapper')];
  if (wrappers.length < 2) return;
  const group = document.createElement('div');
  group.className = 'hero-actions';
  const first = wrappers[0];
  first.parentNode.insertBefore(group, first);
  wrappers.forEach((w) => group.append(w));
}

function normalizeHeadline(inner) {
  inner.querySelectorAll('.hero-accent').forEach((el) => {
    el.classList.add('hero-gradient');
  });
}

export default function decorate(block) {
  const svgNS = 'http://www.w3.org/2000/svg';
  block.classList.add('hero-shader');

  const inner = document.createElement('div');
  inner.className = 'hero-inner';
  [...block.childNodes].forEach((node) => inner.append(node));

  normalizeHeadline(inner);

  const picture = inner.querySelector('picture');
  if (picture) picture.classList.add('hero-shader-photo');

  block.append(createMeshCanvas('hero-mesh'));
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

  const mesh = block.querySelector('canvas.hero-mesh');
  const teardown = mesh ? initFlowAnimation(block, mesh) : () => {};

  requestAnimationFrame(() => {
    block.classList.add('hero-ready');
  });

  block.dataset.shaderInit = 'true';
  return teardown;
}
