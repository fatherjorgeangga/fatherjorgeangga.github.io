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
