// ==============================================
// lightbox.js
// Opens a YouTube video in a full-screen overlay
// when a .video-card is clicked. Closes on the
// X button or clicking outside the video.
// ==============================================

const lightbox        = document.getElementById('lightbox');
const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxVideo   = document.getElementById('lightbox-video');
const lightboxClose   = document.getElementById('lightbox-close');

// -- Helpers --
// Converts "m:ss" or plain seconds string to integer seconds
function toSeconds(val) {
  if (!val) return null;
  if (val.includes(':')) {
    const [m, s] = val.split(':').map(Number);
    return m * 60 + s;
  }
  return parseInt(val, 10);
}

// -- Open --
// Find all video cards and attach click handlers
document.querySelectorAll('.video-card').forEach(card => {
  card.addEventListener('click', () => {
    const id    = card.dataset.videoId;
    const start = toSeconds(card.dataset.start);
    const end   = toSeconds(card.dataset.end);

    // Build embed URL — append start/end only if set
    let params = 'autoplay=1&rel=0&modestbranding=1';
    if (start !== null) params += `&start=${start}`;
    if (end   !== null) params += `&end=${end}`;

    lightboxVideo.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${id}?${params}"
      allow="autoplay; encrypted-media"
      allowfullscreen
    ></iframe>`;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  });
});

// -- Close --
function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxVideo.innerHTML = ''; // stop video playback
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', closeLightbox);

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});
