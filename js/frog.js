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
const mouth    = document.getElementById('layer-mouth');
const tongue   = document.getElementById('layer-tongue');

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
const MOUTH_FRAC       = { x: 0.5, y: 0.62 };
const TONGUE_BASE_ANGLE = 0; // degrees; adjust if tongue art points a different direction

function aimTongue() {
  const rect = tongue.getBoundingClientRect();
  const svgAspect = 1920 / 1080;
  const elAspect  = rect.width / rect.height;

  let scale, offX, offY;
  if (elAspect > svgAspect) {
    // letterboxed horizontally
    scale = rect.height / 1080;
    offX  = (rect.width - 1920 * scale) / 2;
    offY  = 0;
  } else {
    // letterboxed vertically
    scale = rect.width / 1920;
    offX  = 0;
    offY  = (rect.height - 1080 * scale) / 2;
  }

  // Origin within the element (px from top-left of element)
  const originX = offX + MOUTH_FRAC.x * 1920 * scale;
  const originY = offY + MOUTH_FRAC.y * 1080 * scale;

  // Mouth screen position
  const mouthScreenX = rect.left + originX;
  const mouthScreenY = rect.top  + originY;

  const dx    = currentFlyX - mouthScreenX;
  const dy    = currentFlyY - mouthScreenY;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI - TONGUE_BASE_ANGLE;

  tongue.style.transformOrigin = `${originX}px ${originY}px`;
  tongue.style.transform       = `rotate(${angle}deg)`;
}

// ==============================================
// BLINK ANIMATION
// ==============================================
const EYELID = {
  l: {
    open:   'FrogFix/Frogredo_0007s_0000_L-eyelid-1.png',
    half:   'FrogFix/Frogredo_0007s_0001_L-eyelid-blink-1.png',
    closed: 'FrogFix/Frogredo_0007s_0002_L-eyelid-blink-2.png',
  },
  r: {
    open:   'FrogFix/Frogredo_0001s_0000_R-eyelid-1.png',
    half:   'FrogFix/Frogredo_0001s_0001_R-eyelid-blink-1.png',
    closed: 'FrogFix/Frogredo_0001s_0002_R-eyelid-blink-2.png',
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
  1: 'FrogFix/Frogredo_0005s_0000_Mouth-1.png',
  2: 'FrogFix/Frogredo_0005s_0001_Mouth-2.png',
  3: 'FrogFix/Frogredo_0005s_0002_Mouth-3.png',
  4: 'FrogFix/Frogredo_0005s_0003_Mouth-4.png',
};

const TONGUE_FRAMES = {
  1: 'FrogFix/Frogredo_0004s_0000_Tongue-1.png',
  2: 'FrogFix/Frogredo_0004s_0001_Tongue-2.png',
  3: 'FrogFix/Frogredo_0004s_0002_Tongue-3.png',
  4: 'FrogFix/Frogredo_0004s_0003_Tongue-4.png',
};

let eating = false;

function eatFly(onDone) {
  if (eating) return;
  eating = true;

  // Aim tongue at fly before showing it
  aimTongue();

  fly.style.opacity = '0';
  mouth.src = MOUTH[2];

  setTimeout(() => {
    mouth.src = MOUTH[3];
    tongue.style.opacity = '1';
    tongue.src = TONGUE_FRAMES[1];
    setTimeout(() => {
      tongue.src = TONGUE_FRAMES[2];
      setTimeout(() => {
        tongue.src = TONGUE_FRAMES[3];
        mouth.src  = MOUTH[4];
        setTimeout(() => {
          tongue.src = TONGUE_FRAMES[4];
          setTimeout(() => {
            tongue.style.opacity = '0';
            mouth.src = MOUTH[1];
            fly.style.opacity = '1';
            eating = false;
            if (onDone) onDone();
          }, 80);
        }, 80);
      }, 120);
    }, 80);
  }, 60);
}

// ==============================================
// DESKTOP: mouse follow + click/selection to eat
// ==============================================
if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    applyFlyPosition(e.clientX, e.clientY);
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
      });
    }
  }, { passive: true });

  function tick() {
    flyX += (targetX - flyX) * SPEED;
    flyY += (targetY - flyY) * SPEED;

    applyFlyPosition(flyX, flyY);

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
