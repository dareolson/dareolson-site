// ==============================================
// frog.js
// 1. Fly cursor — follows mouse (desktop) or wanders (mobile)
// 2. Eye tracking — frog looks toward fly
// 3. Blink — random, every 2-6 seconds
// 4. Eat — tongue rotates toward fly, triggered by click/tap
// ==============================================

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// DOM references
const fly      = document.getElementById('fly-cursor');
const lEyeball = document.getElementById('layer-l-eyeball');
const rEyeball = document.getElementById('layer-r-eyeball');
const lEyelid  = document.getElementById('layer-l-eyelid');
const rEyelid  = document.getElementById('layer-r-eyelid');
const mouth          = document.getElementById('layer-mouth');
const tongue         = document.getElementById('layer-tongue');     // src swaps only
const tongueWrapper  = document.getElementById('tongue-wrapper');   // rotation + opacity

const flyOffsetX = fly.offsetWidth  / 2;
const flyOffsetY = fly.offsetHeight / 2;

// Track current fly screen position globally so eatFly() can aim the tongue
let currentFlyX = window.innerWidth  / 2;
let currentFlyY = window.innerHeight / 2;

// ==============================================
// EYE TRACKING SETTINGS
// ==============================================
const EYE_RANGE    = isTouchDevice ? 4 : 8;
const L_EYE_OFFSET = { x: -10 + (isTouchDevice ? 11 : 0), y: isTouchDevice ? 4 : 6 };
const R_EYE_OFFSET = { x: 22  - (isTouchDevice ? 18 : 0), y: isTouchDevice ? 4 : 6 };

function applyFlyPosition(x, y) {
  currentFlyX = x;
  currentFlyY = y;
  fly.style.transform = `translate3d(${x - flyOffsetX}px, ${y - flyOffsetY}px, 0)`;
  const offsetX = ((x / window.innerWidth)  - 0.5) * 2 * EYE_RANGE;
  const offsetY = ((y / window.innerHeight) - 0.5) * 2 * EYE_RANGE;
  lEyeball.style.transform = `translate3d(${offsetX + L_EYE_OFFSET.x}px, ${offsetY + L_EYE_OFFSET.y}px, 0)`;
  rEyeball.style.transform = `translate3d(${offsetX + R_EYE_OFFSET.x}px, ${offsetY + R_EYE_OFFSET.y}px, 0)`;
}

// ==============================================
// TONGUE AIM
// Computes the mouth's screen position from the
// tongue element's rendered size, then rotates
// the tongue toward the fly.
//
// MOUTH_FRAC = mouth center as a fraction of the
// 1920x1080 artwork canvas. Tune if needed.
// TONGUE_BASE_ANGLE = direction the tongue points
// at rest in the artwork (0 = right, -90 = up).
// ==============================================
const MOUTH_FRAC       = { x: 0.482, y: 0.296 }; // mouth center: x:925, y:320 in 1920x1080 artwork
const TONGUE_BASE_ANGLE = 0; // tongue art points RIGHT in the artwork

// Compute and lock the tongue pivot point once on load.
// Only the rotation angle changes after this.
let mouthScreenX, mouthScreenY, tongueNaturalLength, tongueOriginX, tongueOriginY;

function initTongueOrigin() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Letterbox 1920x1080 within the layout container (viewport size, pre-scale)
  const scale = Math.min(vw / 1920, vh / 1080);
  const offX  = (vw - 1920 * scale) / 2;
  const offY  = (vh - 1080 * scale) / 2;

  // Mouth position in the element's own layout coordinates (pre-scale)
  const localX = offX + MOUTH_FRAC.x * 1920 * scale;
  const localY = offY + MOUTH_FRAC.y * 1080 * scale;

  tongueOriginX = localX;
  tongueOriginY = localY;
  tongueWrapper.style.transformOrigin = `${tongueOriginX}px ${tongueOriginY}px`;

  const FROG_SCALE = 0.8;
  const cx = vw / 2;
  const cy = vh / 2;
  mouthScreenX = cx + (localX - cx) * FROG_SCALE;
  mouthScreenY = cy + (localY - cy) * FROG_SCALE;

  // Natural tongue length = canvas distance from mouth (x:925) to tip (x:1910)
  // converted to screen pixels after object-fit scale and frog scale.
  // TONGUE_STRETCH_CORRECTION compensates for any canvas-to-screen measurement drift.
  const TONGUE_TIP_FRAC        = (1910 - 874) / 1920; // base x:874 to tip x:1910 = 1036px
  const TONGUE_STRETCH_CORRECTION = 0.65;
  tongueNaturalLength = TONGUE_TIP_FRAC * 1920 * scale * FROG_SCALE * TONGUE_STRETCH_CORRECTION;

  const dbg = document.getElementById('debug-dot');
  if (dbg) dbg.textContent = `pivot ${Math.round(mouthScreenX)},${Math.round(mouthScreenY)} len ${Math.round(tongueNaturalLength)}`;

  // Visual crosshair at computed mouth position — remove once pivot is confirmed correct
  let pin = document.getElementById('mouth-pin');
  if (!pin) {
    pin = document.createElement('div');
    pin.id = 'mouth-pin';
    pin.style.cssText = 'position:fixed;width:14px;height:14px;border-radius:50%;background:red;border:2px solid white;pointer-events:none;z-index:99999;transform:translate(-50%,-50%)';
    document.body.appendChild(pin);
  }
  pin.style.left = mouthScreenX + 'px';
  pin.style.top  = mouthScreenY + 'px';
}

function aimTongue() {
  // Reapply transformOrigin on wrapper — wrapper holds the rotation, img holds only src
  tongueWrapper.style.transformOrigin = `${tongueOriginX}px ${tongueOriginY}px`;

  const dx   = currentFlyX - mouthScreenX;
  const dy   = currentFlyY - mouthScreenY;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI - TONGUE_BASE_ANGLE;

  // Stretch tongue to reach the fly — minimum 1x so it never shrinks below natural size
  const stretch = Math.max(1, dist / tongueNaturalLength);

  // scaleX applied before rotate so it stretches along the tongue's own axis
  tongueWrapper.style.transform = `rotate(${angle}deg) scaleX(${stretch})`;
}

// Set origin immediately, again on load, and again on resize or fullscreen
initTongueOrigin();
window.addEventListener('load', initTongueOrigin);
window.addEventListener('resize', initTongueOrigin);
document.addEventListener('fullscreenchange', initTongueOrigin);
document.addEventListener('webkitfullscreenchange', initTongueOrigin);

// ==============================================
// BLINK ANIMATION
// ==============================================
const EYELID = {
  l: {
    open:   'FrogFix/L-eyelid-1.png',
    half:   'FrogFix/L-eyelid-blink-1.png',
    closed: 'FrogFix/L-eyelid-blink-2.png',
  },
  r: {
    open:   'FrogFix/R-eyelid-1.png',
    half:   'FrogFix/R-eyelid-blink-1.png',
    closed: 'FrogFix/R-eyelid-blink-2.png',
  }
};

function blink() {
  lEyelid.src = EYELID.l.half;  rEyelid.src = EYELID.r.half;
  setTimeout(() => {
    lEyelid.src = EYELID.l.closed; rEyelid.src = EYELID.r.closed;
    setTimeout(() => {
      lEyelid.src = EYELID.l.half;  rEyelid.src = EYELID.r.half;
      setTimeout(() => {
        lEyelid.src = EYELID.l.open;  rEyelid.src = EYELID.r.open;
        scheduleBlink();
      }, 60);
    }, 80);
  }, 60);
}

function scheduleBlink() {
  setTimeout(blink, 2000 + Math.random() * 4000);
}

scheduleBlink();

// ==============================================
// EAT ANIMATION
// ==============================================
const MOUTH = {
  1: 'FrogFix/Mouth-1.png',
  2: 'FrogFix/Mouth-2.png',
  3: 'FrogFix/Mouth-3.png',
  4: 'FrogFix/Mouth-4.png',
};

const TONGUE_FRAMES = {
  1: 'FrogFix/Tongue-1.png',
  2: 'FrogFix/Tongue-2.png',
  3: 'FrogFix/Tongue-3.png',
  4: 'FrogFix/Tongue-4.png',
};

// Preload all animation frames so src swaps are instant with no decode delay
[...Object.values(MOUTH), ...Object.values(TONGUE_FRAMES)].forEach(src => {
  const img = new Image(); img.src = src;
});

let eating       = false;
let flySpawning  = false; // true while the new fly is animating in — blocks mousemove updates

// ==============================================
// SPAWN NEW FLY
// After eating, waits ~1s then flies a new fly
// in from a random screen edge to the cursor.
// ==============================================
function spawnNewFly() {
  // Pick a random off-screen starting point on one of the four edges
  const edge = Math.floor(Math.random() * 4); // 0=top 1=right 2=bottom 3=left
  let startX, startY;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  switch (edge) {
    case 0: startX = Math.random() * vw; startY = -60;      break; // top
    case 1: startX = vw + 60;            startY = Math.random() * vh; break; // right
    case 2: startX = Math.random() * vw; startY = vh + 60;  break; // bottom
    case 3: startX = -60;                startY = Math.random() * vh; break; // left
  }

  // Save destination NOW before applyFlyPosition overwrites currentFlyX/Y with the edge coords
  const destX = currentFlyX;
  const destY = currentFlyY;

  // Snap fly to the off-screen start position (no transition yet)
  flySpawning = true;
  applyFlyPosition(startX, startY);
  fly.style.opacity = '1';

  // Short pause so the snap registers, then animate to saved destination
  setTimeout(() => {
    fly.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    applyFlyPosition(destX, destY); // use saved destination, not currentFlyX/Y (which was overwritten above)

    // Cleanup — restores normal mouse control
    const cleanup = () => {
      fly.style.transition = '';
      flySpawning = false;
    };

    // Primary: transitionend fires when animation completes
    fly.addEventListener('transitionend', cleanup, { once: true });

    // Fallback: if transitionend never fires (e.g. start === end position),
    // force cleanup after the animation duration + a small buffer
    setTimeout(cleanup, 800);
  }, 50);
}

function eatFly(onDone) {
  if (eating) return;
  eating = true;

  // Reinitialize if viewport changed without firing resize (e.g. fullscreen)
  if (!mouthScreenX) initTongueOrigin();

  const eatX = currentFlyX;
  const eatY = currentFlyY;

  aimTongue();

  // Frame sequence: [delay_ms, action]
  // 50ms gaps — 3 rAF ticks at 60fps, enough that no frame can be skipped
  const frames = [
    [0,   () => { mouth.src = MOUTH[2]; }],
    [50,  () => { fly.style.opacity = '0'; mouth.src = MOUTH[3]; tongueWrapper.style.opacity = '1'; tongue.src = TONGUE_FRAMES[2]; aimTongue(); }],
    [100, () => { tongue.src = TONGUE_FRAMES[3]; mouth.src = MOUTH[4]; applyFlyPosition(eatX, eatY); fly.style.opacity = '1'; aimTongue(); }],
    [150, () => { tongue.src = TONGUE_FRAMES[2]; aimTongue(); fly.style.transition = 'transform 0.1s ease-in'; applyFlyPosition(mouthScreenX, mouthScreenY); }],
    [200, () => { mouth.src = MOUTH[3]; }],
    [260, () => {
      fly.style.transition = '';
      fly.style.opacity    = '0';
      tongueWrapper.style.opacity = '0';
      mouth.src = MOUTH[1];
      eating = false;
      if (onDone) {
        onDone();
      } else {
        setTimeout(spawnNewFly, 800);
      }
    }],
  ];

  const start = performance.now();
  let fi = 0;

  function step(now) {
    if (fi < frames.length && now - start >= frames[fi][0]) {
      frames[fi][1]();
      fi++;
    }
    if (fi < frames.length) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ==============================================
// NAV LINK INTERCEPTION
// Clicking any <a> tag triggers the eat animation
// first, then navigates once the fly is swallowed.
// ==============================================
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;

  // Let external links, new-tab links, and anchor links pass through normally
  const href = link.getAttribute('href');
  if (link.target === '_blank' || href.startsWith('#') || href.startsWith('mailto:')) return;

  e.preventDefault(); // stop immediate navigation

  eatFly(() => {
    // Fade out then navigate after the fly is swallowed
    window.navigateWithFade(href);
  });
});

// ==============================================
// DESKTOP: mouse follow + click/selection to eat
// ==============================================
if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    // Always track cursor position so spawnNewFly knows where to land,
    // but don't move the fly while it's animating in from the edge
    currentFlyX = e.clientX;
    currentFlyY = e.clientY;
    if (!flySpawning) applyFlyPosition(e.clientX, e.clientY);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('a, button, input, textarea')) {
      eatFly();
    }
  });

  document.addEventListener('mouseup', () => {
    if (window.getSelection().toString().length > 0) {
      eatFly();
    }
  });
}

// ==============================================
// MOBILE: autonomous wandering + tap to eat
// ==============================================
if (isTouchDevice) {
  const MARGIN = 80;
  const SPEED  = 0.03;

  let flyX    = window.innerWidth  / 2;
  let flyY    = window.innerHeight / 2;
  let targetX = flyX;
  let targetY = flyY;
  let waiting = false;

  function pickTarget() {
    targetX = MARGIN + Math.random() * (window.innerWidth  - MARGIN * 2);
    targetY = MARGIN + Math.random() * (window.innerHeight - MARGIN * 2);
  }

  pickTarget();

  document.addEventListener('touchend', (e) => {
    if (!e.target.closest('a, button')) {
      eatFly(() => {
        waiting = false;
        pickTarget();
        // Spawn a new fly after eating — same as desktop behaviour
        setTimeout(spawnNewFly, 1000);
      });
    }
  }, { passive: true });

  function tick() {
    // Don't move the fly while it's animating in or while the eat animation is running
    if (!flySpawning && !eating) {
      flyX += (targetX - flyX) * SPEED;
      flyY += (targetY - flyY) * SPEED;
      applyFlyPosition(flyX, flyY);
    }

    const dist = Math.hypot(targetX - flyX, targetY - flyY);
    if (dist < 6 && !waiting) {
      waiting = true;
      setTimeout(() => {
        pickTarget();
        waiting = false;
      }, 400 + Math.random() * 800);
    }

    requestAnimationFrame(tick);
  }

  tick();
}
