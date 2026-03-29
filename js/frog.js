// ==============================================
// frog.js
// Handles two things:
//   1. Moving the fly cursor to follow the mouse
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
// MOUSEMOVE HANDLER
// ==============================================
document.addEventListener('mousemove', (e) => {
  const mx = e.clientX;
  const my = e.clientY;

  // -- Fly cursor --
  // translate3d forces a dedicated GPU compositing layer.
  // Direct pixel values avoid any runtime calc() overhead.
  fly.style.transform = `translate3d(${mx - flyOffsetX}px, ${my - flyOffsetY}px, 0)`;

  // -- Eye tracking --
  const offsetX = ((mx / window.innerWidth)  - 0.5) * 2 * EYE_RANGE;
  const offsetY = ((my / window.innerHeight) - 0.5) * 2 * EYE_RANGE;

  lEyeball.style.transform = `translate3d(${offsetX + L_EYE_OFFSET.x}px, ${offsetY + L_EYE_OFFSET.y}px, 0)`;
  rEyeball.style.transform = `translate3d(${offsetX + R_EYE_OFFSET.x}px, ${offsetY + R_EYE_OFFSET.y}px, 0)`;
});
