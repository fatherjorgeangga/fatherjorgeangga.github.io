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
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const linkPage = link.getAttribute('href');
    link.classList.toggle('active', linkPage === currentPage);
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

});

// Auto-count entries from other pages (only runs on index.html)
  const countTargets = [
    { file: 'fathers.html', elementId: 'count-fathers' },
    { file: 'councils.html', elementId: 'count-councils' },
    { file: 'saints.html', elementId: 'count-saints' },
    { file: 'books.html', elementId: 'count-books' }
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
