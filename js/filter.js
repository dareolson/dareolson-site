// ==============================================
// filter.js
// Filters video cards by category when tabs are clicked.
// Also hides section headers when all their cards are hidden.
// ==============================================

const tabs    = document.querySelectorAll('.filter-tab');
const cards   = document.querySelectorAll('.video-card');
const sections = document.querySelectorAll('.work-section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;

    // Update active tab
    tabs.forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    // Show/hide cards
    cards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.display = match ? '' : 'none';
    });

    // Hide sections where all cards are hidden
    sections.forEach(section => {
      const sectionCards = section.querySelectorAll('.video-card');
      const anyVisible = Array.from(sectionCards).some(c => c.style.display !== 'none');
      section.style.display = anyVisible ? '' : 'none';
    });
  });
});
