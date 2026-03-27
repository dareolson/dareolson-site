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

// ==============================================
// EYE TRACKING SETTINGS
// EYE_RANGE — max px the eyeballs shift toward
//   the cursor from their resting position.
//   Keep small: the SVGs are full-viewport so
//   even 8px moves the art noticeably.
//
// L_EYE_OFFSET / R_EYE_OFFSET — fine-tune each
//   eye's resting position independently.
//   x: positive moves right, negative moves left
//   y: positive moves down, negative moves up
// ==============================================
const EYE_RANGE    = 8;
const L_EYE_OFFSET = { x: -10, y: 6 };  // left eye: nudged inward and slightly down
const R_EYE_OFFSET = { x: 22,  y: 6 };  // right eye: nudged inward and slightly down

// ==============================================
// MOUSEMOVE HANDLER
// Fires every time the mouse moves.
// Updates the fly position and both eyeballs.
// ==============================================
document.addEventListener('mousemove', (e) => {
  const mx = e.clientX; // mouse X position in the viewport
  const my = e.clientY; // mouse Y position in the viewport

  // -- Fly cursor --
  // Set left/top directly so the CSS flap animation
  // (which uses transform) isn't overwritten.
  fly.style.left = `${mx}px`;
  fly.style.top  = `${my}px`;

  // -- Eye tracking --
  // Convert mouse position (0 to viewport width/height)
  // into a -EYE_RANGE to +EYE_RANGE offset.
  // When mouse is dead center, offset is 0 (eyes look straight ahead).
  const offsetX = ((mx / window.innerWidth)  - 0.5) * 2 * EYE_RANGE;
  const offsetY = ((my / window.innerHeight) - 0.5) * 2 * EYE_RANGE;

  // Apply tracking offset + the per-eye resting position nudge
  lEyeball.style.transform = `translate(${offsetX + L_EYE_OFFSET.x}px, ${offsetY + L_EYE_OFFSET.y}px)`;
  rEyeball.style.transform = `translate(${offsetX + R_EYE_OFFSET.x}px, ${offsetY + R_EYE_OFFSET.y}px)`;
});
