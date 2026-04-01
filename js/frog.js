// ==============================================
// frog.js
// 1. Fly cursor — follows mouse (desktop) or wanders (mobile)
// 2. Eye tracking — frog looks toward fly
// 3. Blink — random, every 2-6 seconds
// 4. Eat — tongue rotates toward fly, triggered by click/tap
// ==============================================

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// DOM references
const fly           = document.getElementById('fly-cursor');
const lEyeball      = document.getElementById('layer-l-eyeball');
const rEyeball      = document.getElementById('layer-r-eyeball');
const lEyelid       = document.getElementById('layer-l-eyelid');
const rEyelid       = document.getElementById('layer-r-eyelid');
const mouth         = document.getElementById('layer-mouth');
const tongue        = document.getElementById('layer-tongue');    // src swaps only
const tongueWrapper = document.getElementById('tongue-wrapper');  // rotation + opacity

const flyOffsetX = fly.offsetWidth  / 2;
const flyOffsetY = fly.offsetHeight / 2;

// Track current fly screen position globally so eatFly() can aim the tongue
let currentFlyX = window.innerWidth  / 2;
let currentFlyY = window.innerHeight / 2;

// ==============================================
// EYE TRACKING
// EYE_RANGE: max px eyeballs shift from center.
// L/R_EYE_OFFSET: resting position of each eyeball
// within its socket — tuned per device type.
// ==============================================
const EYE_RANGE    = isTouchDevice ? 4 : 12;
const L_EYE_OFFSET = { x: -10 + (isTouchDevice ? 11 : 0), y: isTouchDevice ? 4 : 6 };
const R_EYE_OFFSET = { x: 22  - (isTouchDevice ? 18 : 0), y: isTouchDevice ? 4 : 6 };

// Moves the fly cursor and updates eye tracking to follow it
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
// The tongue artwork is a full 1920x1080 PNG that
// rotates around the mouth pivot. We compute the
// pivot in screen coordinates from the known mouth
// position in the original Photoshop canvas.
//
// MOUTH_FRAC = mouth center as a fraction of the
// 1920x1080 artwork canvas.
// TONGUE_BASE_ANGLE = direction tongue points at
// rest in the artwork (0 = right, -90 = up).
// ==============================================
const MOUTH_FRAC        = { x: 0.482, y: 0.296 }; // mouth center: x:925, y:320 in 1920x1080 artwork
const TONGUE_BASE_ANGLE = 0; // tongue art points RIGHT in the artwork

// Pivot point in pre-scale layout coords, and corresponding screen coords
// accounting for the #frog container's scale(0.8). Recalculated on resize.
let mouthScreenX, mouthScreenY, tongueNaturalLength, tongueOriginX, tongueOriginY;

function initTongueOrigin() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // How the 1920x1080 artwork fits (letterboxed) inside the viewport
  const scale = Math.min(vw / 1920, vh / 1080);
  const offX  = (vw - 1920 * scale) / 2;
  const offY  = (vh - 1080 * scale) / 2;

  // Mouth position in layout coordinates (before the #frog scale is applied)
  const localX = offX + MOUTH_FRAC.x * 1920 * scale;
  const localY = offY + MOUTH_FRAC.y * 1080 * scale;

  // transformOrigin on the wrapper uses layout coords — pivot stays fixed across src swaps
  tongueOriginX = localX;
  tongueOriginY = localY;
  tongueWrapper.style.transformOrigin = `${tongueOriginX}px ${tongueOriginY}px`;

  // #frog is scaled 0.8 from center — convert layout coords to actual screen coords
  const FROG_SCALE = 0.8;
  const cx = vw / 2;
  const cy = vh / 2;
  mouthScreenX = cx + (localX - cx) * FROG_SCALE;
  mouthScreenY = cy + (localY - cy) * FROG_SCALE;

  // Natural tongue length in screen pixels: artwork distance from base (x:925) to tip (x:1910),
  // scaled by object-fit scale and frog scale — used to calculate stretch ratio
  tongueNaturalLength = ((1910 - 925) / 1920) * 1920 * scale * FROG_SCALE;
}

// Rotates the tongue wrapper to point at the fly and stretches it to reach
function aimTongue() {
  // Reapply transformOrigin each call — wrapper is stable but defensive is cheap
  tongueWrapper.style.transformOrigin = `${tongueOriginX}px ${tongueOriginY}px`;

  const dx    = currentFlyX - mouthScreenX;
  const dy    = currentFlyY - mouthScreenY;
  const dist  = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI - TONGUE_BASE_ANGLE;

  // Stretch to reach the fly — never shrink below natural size
  const stretch = Math.max(1, dist / tongueNaturalLength);

  // scaleX before rotate so stretching is along the tongue's own axis
  tongueWrapper.style.transform = `rotate(${angle}deg) scaleX(${stretch})`;
}

// Recalculate pivot whenever the viewport changes
initTongueOrigin();
window.addEventListener('load', initTongueOrigin);
window.addEventListener('resize', initTongueOrigin);
document.addEventListener('fullscreenchange', initTongueOrigin);
document.addEventListener('webkitfullscreenchange', initTongueOrigin);

// ==============================================
// BLINK ANIMATION
// Cycles through half-open → closed → half-open → open
// on both eyelids simultaneously, then reschedules.
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
  lEyelid.src = EYELID.l.half;   rEyelid.src = EYELID.r.half;
  setTimeout(() => {
    lEyelid.src = EYELID.l.closed; rEyelid.src = EYELID.r.closed;
    setTimeout(() => {
      lEyelid.src = EYELID.l.half;   rEyelid.src = EYELID.r.half;
      setTimeout(() => {
        lEyelid.src = EYELID.l.open;   rEyelid.src = EYELID.r.open;
        scheduleBlink();
      }, 60);
    }, 80);
  }, 60);
}

function scheduleBlink() {
  setTimeout(blink, 2000 + Math.random() * 4000);
}

// Blink once shortly after load so visitors know the frog is alive,
// then blink() hands off to the normal random schedule
setTimeout(blink, 1500);

// ==============================================
// EAT ANIMATION
// Frame images — preloaded on startup so src swaps
// are instant with no decode delay.
// ==============================================
const MOUTH = {
  1: 'FrogFix/Mouth-1.png',
  2: 'FrogFix/Mouth-2.png',
  3: 'FrogFix/Mouth-3.png',
  4: 'FrogFix/Mouth-4.png',
};

const TONGUE_FRAMES = {
  2: 'FrogFix/Tongue-2.png',
  3: 'FrogFix/Tongue-3.png',
};

// Preload all animation frames so src swaps are instant with no decode delay
[...Object.values(MOUTH), ...Object.values(TONGUE_FRAMES)].forEach(src => {
  const img = new Image(); img.src = src;
});

let eating       = false;
let flySpawning  = false; // true while the new fly is animating in — blocks mousemove updates
let flyWandering = false; // desktop only — true after spawn until mouse moves

// ==============================================
// SPAWN NEW FLY
// After eating, flies a new fly in from a random
// screen edge. On desktop the fly buzzes around
// autonomously until the mouse moves, then snaps
// back to cursor control.
// ==============================================
function spawnNewFly() {
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  const MARGIN = 80;
  const edge   = Math.floor(Math.random() * 4); // 0=top 1=right 2=bottom 3=left
  let startX, startY;

  switch (edge) {
    case 0: startX = Math.random() * vw; startY = -60;      break;
    case 1: startX = vw + 60;            startY = Math.random() * vh; break;
    case 2: startX = Math.random() * vw; startY = vh + 60;  break;
    case 3: startX = -60;                startY = Math.random() * vh; break;
  }

  // On desktop, land at a random spot rather than the cursor (which may be at the mouth)
  const destX = isTouchDevice ? currentFlyX : MARGIN + Math.random() * (vw - MARGIN * 2);
  const destY = isTouchDevice ? currentFlyY : MARGIN + Math.random() * (vh - MARGIN * 2);

  // Snap to off-screen start (no transition), then animate to destination
  flySpawning = true;
  applyFlyPosition(startX, startY);
  fly.style.opacity = '1';

  setTimeout(() => {
    fly.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    applyFlyPosition(destX, destY);

    const cleanup = () => {
      fly.style.transition = '';
      flySpawning = false;
      // On desktop, start autonomous wandering until the mouse moves
      if (!isTouchDevice) {
        flyWandering = true;
        startDesktopWander();
      }
    };

    fly.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 800);
  }, 50);
}

// Lerp the fly around random targets on desktop until the mouse moves.
// Called once after each spawn; stops itself when flyWandering goes false.
function startDesktopWander() {
  const MARGIN = 80;
  const SPEED  = 0.03;
  let wanderX  = currentFlyX;
  let wanderY  = currentFlyY;
  let targetX  = MARGIN + Math.random() * (window.innerWidth  - MARGIN * 2);
  let targetY  = MARGIN + Math.random() * (window.innerHeight - MARGIN * 2);
  let waiting  = false;

  function wanderTick() {
    if (!flyWandering) return; // mouse moved — hand control back to cursor
    if (!flySpawning && !eating) {
      wanderX += (targetX - wanderX) * SPEED;
      wanderY += (targetY - wanderY) * SPEED;
      applyFlyPosition(wanderX, wanderY);
    }
    if (Math.hypot(targetX - wanderX, targetY - wanderY) < 6 && !waiting) {
      waiting = true;
      setTimeout(() => {
        if (!flyWandering) return;
        targetX = MARGIN + Math.random() * (window.innerWidth  - MARGIN * 2);
        targetY = MARGIN + Math.random() * (window.innerHeight - MARGIN * 2);
        waiting = false;
      }, 400 + Math.random() * 800);
    }
    requestAnimationFrame(wanderTick);
  }

  requestAnimationFrame(wanderTick);
}

// ==============================================
// EAT ANIMATION
// Mouth opens, tongue shoots out toward the fly
// (frames 2→3), fly gets pulled back to mouth
// (frame 2 retract), then everything resets.
// Uses requestAnimationFrame + performance.now()
// so frames can't be skipped on slow paints.
// ==============================================
function eatFly(onDone) {
  if (eating) return;
  eating = true;

  // Reinitialize if viewport changed without firing resize (e.g. fullscreen)
  if (!mouthScreenX) initTongueOrigin();

  const eatX = currentFlyX;
  const eatY = currentFlyY;

  aimTongue();

  // [delay_ms, action] — 50ms gaps give the browser a full rAF tick per frame
  const frames = [
    [0,   () => { mouth.src = MOUTH[2]; }],
    [50,  () => { fly.style.opacity = '0'; mouth.src = MOUTH[3]; tongueWrapper.style.opacity = '1'; tongue.src = TONGUE_FRAMES[2]; aimTongue(); }],
    [100, () => { tongue.src = TONGUE_FRAMES[3]; mouth.src = MOUTH[4]; applyFlyPosition(eatX, eatY); fly.style.opacity = '1'; aimTongue(); }],
    [150, () => { tongue.src = TONGUE_FRAMES[2]; aimTongue(); fly.style.transition = 'transform 0.1s ease-in'; applyFlyPosition(mouthScreenX, mouthScreenY); }],
    [200, () => { mouth.src = MOUTH[3]; }],
    [260, () => {
      fly.style.transition        = '';
      fly.style.opacity           = '0';
      tongueWrapper.style.opacity = '0';
      mouth.src = MOUTH[1];
      eating    = false;
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
// External, new-tab, anchor, and mailto links are
// passed through immediately without eating.
// ==============================================
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (link.target === '_blank' || href.startsWith('#') || href.startsWith('mailto:')) return;

  e.preventDefault();

  eatFly(() => {
    window.navigateWithFade(href);
  });
});

// ==============================================
// DESKTOP: mouse follow + click/selection to eat
// ==============================================
if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    currentFlyX = e.clientX;
    currentFlyY = e.clientY;
    // Stop autonomous wandering as soon as the mouse moves — reattach fly to cursor
    if (flyWandering) flyWandering = false;
    if (!flySpawning && !flyWandering) applyFlyPosition(e.clientX, e.clientY);
  });

  // Click on empty space triggers eat
  document.addEventListener('click', (e) => {
    if (!e.target.closest('a, button, input, textarea')) {
      eatFly();
    }
  });

  // Text selection triggers eat
  document.addEventListener('mouseup', () => {
    if (window.getSelection().toString().length > 0) {
      eatFly();
    }
  });
}

// ==============================================
// MOBILE: autonomous wandering + tap to eat
// Fly lerps toward a random target, pauses when
// it arrives, then picks a new target.
// ==============================================
if (isTouchDevice) {
  const MARGIN = 80;  // keep fly away from screen edges
  const SPEED  = 0.03; // lerp factor — lower = slower/smoother

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
        setTimeout(spawnNewFly, 1000);
      });
    }
  }, { passive: true });

  function tick() {
    if (!flySpawning && !eating) {
      flyX += (targetX - flyX) * SPEED;
      flyY += (targetY - flyY) * SPEED;
      applyFlyPosition(flyX, flyY);
    }

    // When fly reaches target, pause then pick a new one
    if (Math.hypot(targetX - flyX, targetY - flyY) < 6 && !waiting) {
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
