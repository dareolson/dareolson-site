// ==============================================
// figure.js
// Small frog figures on the Builds pages. Eyeballs follow
// the pointer, scaled to the figure's size. Skipped when the
// visitor prefers reduced motion or has no fine pointer.
// ==============================================
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const figures = Array.from(document.querySelectorAll('[data-eyes]'));
  if (!figures.length) return;

  // Same resting offsets and range as the homepage frog (frog.js),
  // defined against a ~1120px-wide canvas, then scaled to each figure.
  const BASE_W = 1120, RANGE = 14, L = { x: -10, y: 6 }, R = { x: 22, y: 6 };
  let px = window.innerWidth / 2, py = window.innerHeight / 2, queued = false;

  function paint() {
    queued = false;
    figures.forEach((fig) => {
      const r = fig.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const k = fig.querySelector('.stack').getBoundingClientRect().width / BASE_W;
      const dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      const dy = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      fig.querySelectorAll('.eye').forEach((eye) => {
        const base = eye.dataset.side === 'l' ? L : R;
        eye.style.transform = `translate(${(base.x + dx * RANGE) * k}px, ${(base.y + dy * RANGE) * k}px)`;
      });
    });
  }

  document.addEventListener('mousemove', (e) => {
    px = e.clientX; py = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();
})();
