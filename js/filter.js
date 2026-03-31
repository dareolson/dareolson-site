// ==============================================
// filter.js
// 1. Truncate grid to first 12 cards on load
// 2. "Show More" button reveals the rest
// 3. Filter tabs show all matching cards regardless of truncation
//    (filtering implies intent to browse everything)
// 4. Returning to "All" re-truncates if not yet expanded
// ==============================================

const tabs        = document.querySelectorAll('.filter-tab');
const cards       = document.querySelectorAll('.video-card');
const showMoreBtn = document.getElementById('show-more-btn');

const INITIAL_COUNT = 12;
let expanded = false; // true once the user has clicked Show More

// ==============================================
// TRUNCATION
// Hide every card past the first 12 using a CSS class.
// ==============================================
function applyTruncation() {
  cards.forEach((card, i) => {
    card.classList.toggle('is-truncated', i >= INITIAL_COUNT);
  });
  showMoreBtn.style.display = '';
}

function removeTruncation() {
  cards.forEach(card => card.classList.remove('is-truncated'));
  showMoreBtn.style.display = 'none';
}

// Apply on load
applyTruncation();

// ==============================================
// SHOW MORE BUTTON
// ==============================================
showMoreBtn.addEventListener('click', () => {
  expanded = true;
  removeTruncation();
});

// ==============================================
// FILTER TABS
// When a specific category is active, show all
// matching cards (ignore truncation — user is browsing).
// Returning to "All" re-truncates if not yet expanded.
// ==============================================
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;

    // Update active tab highlight
    tabs.forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    if (filter === 'all') {
      // Restore default view
      cards.forEach(card => card.style.display = '');
      if (expanded) {
        removeTruncation();
      } else {
        applyTruncation();
      }
    } else {
      // Show all matching cards, hide non-matching — ignore truncation
      removeTruncation();
      cards.forEach(card => {
        card.style.display = card.dataset.category === filter ? '' : 'none';
      });
      showMoreBtn.style.display = 'none'; // not relevant while filtering
    }
  });
});
