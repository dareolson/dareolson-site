// ==============================================
// main.js
// Loaded on every page.
// 1. Fade in on load
// 2. Fade out + navigate for pages without the frog eat animation
// ==============================================

// ==============================================
// PAGE FADE-IN
// Body starts at opacity:0 (set in style.css).
// Adding .page-visible triggers the CSS transition to opacity:1.
// rAF ensures the browser renders the invisible state first,
// so the transition actually plays rather than snapping instantly.
// ==============================================
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.add('page-visible');
  });
});

// ==============================================
// NAVIGATE WITH FADE
// Fades the page out, then navigates.
// Exposed as a global so frog.js can call it after the eat animation.
// ==============================================
window.navigateWithFade = function(href) {
  document.body.classList.remove('page-visible'); // triggers fade-out transition
  setTimeout(() => {
    window.location.href = href;
  }, 350); // matches the transition duration in style.css
};

// ==============================================
// LINK INTERCEPTION (interior pages only)
// On pages without the frog, intercept nav link clicks
// and run navigateWithFade instead of jumping directly.
// The homepage skips this because frog.js handles it there.
// ==============================================
if (!document.getElementById('frog')) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    // Let external, new-tab, anchor, and mailto links pass through normally
    if (link.target === '_blank' || href.startsWith('#') || href.startsWith('mailto:')) return;

    e.preventDefault();
    window.navigateWithFade(href);
  });
}
