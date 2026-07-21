document.addEventListener('DOMContentLoaded', function () {

  // Hamburger menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      navLinks.classList.toggle('show');
    });
  }

  // Automatically highlight the current page's nav link
  const currentPath = (window.location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '')) || '/';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const linkPath = (link.getAttribute('href').replace(/\/+$/, '')) || '/';
    link.classList.toggle('active', linkPath === currentPath);
  });

  // Book / Church Father search filter (works for both #searchBox and #globalSearch)
  const searchBox = document.getElementById('searchBox') || document.getElementById('globalSearch');
  if (searchBox) {
    searchBox.addEventListener('keyup', function () {
      const search = searchBox.value.toLowerCase();
      document.querySelectorAll('.searchable').forEach(function (item) {
        item.style.display = item.innerText.toLowerCase().includes(search) ? 'block' : 'none';
      });
    });
  }

  // ===========================================
  // ===========================================
  // Broken image fallback — if a portrait/cover
  // image 404s, show a clean icon instead of the
  // raw alt text blowing out the card.
  // ===========================================

  document.querySelectorAll('.book-image').forEach(function (img) {
    img.addEventListener('error', function () {
      const cover = img.closest('.book-cover');
      img.remove();
      if (cover) {
        cover.classList.add('img-fallback');
        cover.textContent = '🖼️';
      }
    }, { once: true });
  });

  // Biography popup — works for any .book-button
  // inside a .book-card, on any page, static or
  // dynamically rendered by Firestore.
  // ===========================================

  const bioOverlay = document.createElement('div');
  bioOverlay.className = 'bio-overlay';
  bioOverlay.innerHTML = '<div class="bio-modal"><button class="bio-close" aria-label="Close">&times;</button><div class="bio-modal-body"></div></div>';
  document.body.appendChild(bioOverlay);

  const bioModalBody = bioOverlay.querySelector('.bio-modal-body');

  function closeBioModal() {
    bioOverlay.classList.remove('show');
  }

  bioOverlay.addEventListener('click', function (e) {
    if (e.target === bioOverlay || e.target.classList.contains('bio-close')) {
      closeBioModal();
    }
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.book-button');
    if (!btn) return;

    const card = btn.closest('.book-card');
    if (!card) return;

    e.preventDefault();

    const coverEl = card.querySelector('.book-cover');
    const contentEl = card.querySelector('.book-content');
    if (!contentEl) return;

    let html = '';

    if (coverEl) {
      const img = coverEl.querySelector('img');
      if (img) {
        html += '<img class="bio-modal-image" src="' + img.src + '" alt="' + img.alt + '">';
      }
    }

    // Copy every element from the card content except the button itself
    html += '<div class="bio-modal-text">';
    Array.from(contentEl.children).forEach(function (child) {
      if (child.classList.contains('book-button')) return;
      html += child.outerHTML;
    });
    html += '</div>';

    bioModalBody.innerHTML = html;
    bioOverlay.classList.add('show');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeBioModal();
  });

});

// Auto-count entries from other pages (only runs on index.html)
  const countTargets = [
    { file: '/fathers/', elementId: 'count-fathers' },
    { file: '/councils/', elementId: 'count-councils' },
    { file: '/saints/', elementId: 'count-saints' },
    { file: '/books/', elementId: 'count-books' }
  ];

  countTargets.forEach(function (target) {
    const el = document.getElementById(target.elementId);
    if (!el) return; // not on this page, skip

    fetch(target.file)
      .then(function (response) { return response.text(); })
      .then(function (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const count = doc.querySelectorAll('.book-card, .card').length;
        el.textContent = count;
      })
      .catch(function () {
        // if fetch fails (e.g. running locally without a server), leave the number as-is
      });
  });
