// ==============================================
// main.js
// Loaded on every page.
// 1. Fade in on load
// 2. Fade out + navigate for pages without the frog eat animation
// ==============================================

// ==============================================
// PAGE FADE-IN
// Body starts at opacity:0 (set in style.css).
// This script runs at the end of <body>, so the DOM is already
// ready — no need to wait for DOMContentLoaded.
// rAF ensures the browser renders the opacity:0 state first
// so the transition actually plays rather than snapping instantly.
// The homepage gets a 1s delay for a dramatic reveal.
// Interior pages fade in immediately.
// ==============================================
const fadeDelay = document.getElementById('frog') ? 1000 : 0;

setTimeout(() => {
  requestAnimationFrame(() => {
    document.body.classList.add('page-visible');
  });
}, fadeDelay);

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
