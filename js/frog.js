// ==============================================
// frog.js
// Handles two things:
//   1. Moving the fly cursor to follow the mouse
//      (desktop) or autonomously wander (mobile)
//   2. Translating the eyeball layers so the frog
//      appears to look toward the fly at all times
// ==============================================

// DOM references
const fly      = document.getElementById('fly-cursor');
const lEyeball = document.getElementById('layer-l-eyeball');
const rEyeball = document.getElementById('layer-r-eyeball');

// Pre-compute centering offset once so it's not recalculated on every move
const flyOffsetX = fly.offsetWidth  / 2;
const flyOffsetY = fly.offsetHeight / 2;

// ==============================================
// EYE TRACKING SETTINGS
// ==============================================
const EYE_RANGE    = 8;
const L_EYE_OFFSET = { x: -10, y: 6 };
const R_EYE_OFFSET = { x: 22,  y: 6 };

// ==============================================
// SHARED: update fly position + eye tracking
// ==============================================
function applyFlyPosition(x, y) {
  fly.style.transform = `translate3d(${x - flyOffsetX}px, ${y - flyOffsetY}px, 0)`;

  const offsetX = ((x / window.innerWidth)  - 0.5) * 2 * EYE_RANGE;
  const offsetY = ((y / window.innerHeight) - 0.5) * 2 * EYE_RANGE;

  lEyeball.style.transform = `translate3d(${offsetX + L_EYE_OFFSET.x}px, ${offsetY + L_EYE_OFFSET.y}px, 0)`;
  rEyeball.style.transform = `translate3d(${offsetX + R_EYE_OFFSET.x}px, ${offsetY + R_EYE_OFFSET.y}px, 0)`;
}

// ==============================================
// DESKTOP: follow the mouse
// ==============================================
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    applyFlyPosition(e.clientX, e.clientY);
  });
}

// ==============================================
// MOBILE: autonomous fly wandering
// Lerps toward a random target. When close
// enough, waits briefly then picks a new one.
// ==============================================
if (isTouchDevice) {
  const MARGIN  = 80;   // keep fly away from edges
  const SPEED   = 0.03; // lerp factor — lower = lazier

  let flyX = window.innerWidth  / 2;
  let flyY = window.innerHeight / 2;
  let targetX = flyX;
  let targetY = flyY;
  let waiting = false;

  function pickTarget() {
    targetX = MARGIN + Math.random() * (window.innerWidth  - MARGIN * 2);
    targetY = MARGIN + Math.random() * (window.innerHeight - MARGIN * 2);
  }

  pickTarget();

  function tick() {
    flyX += (targetX - flyX) * SPEED;
    flyY += (targetY - flyY) * SPEED;

    applyFlyPosition(flyX, flyY);

    // When close enough to target, pause then pick a new one
    const dist = Math.hypot(targetX - flyX, targetY - flyY);
    if (dist < 6 && !waiting) {
      waiting = true;
      setTimeout(() => {
        pickTarget();
        waiting = false;
      }, 400 + Math.random() * 800); // pause 400–1200ms like a real fly
    }

    requestAnimationFrame(tick);
  }

  tick();
}
