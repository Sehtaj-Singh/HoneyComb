document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- BURGER MENU ---------------- */
  const menuBtn = document.getElementById('menuBtn');
  const aside = document.getElementById('pageAside');
  const overlay = document.getElementById('asideOverlay');
  const closeBtn = document.getElementById('asideClose');

  if (menuBtn && aside) {
    menuBtn.addEventListener('click', () => {
      aside.classList.add('open');
      overlay?.classList.add('show');
    });
  }

  if (closeBtn && aside) {
    closeBtn.addEventListener('click', () => {
      aside.classList.remove('open');
      overlay?.classList.remove('show');
    });
  }

  if (overlay && aside) {
    overlay.addEventListener('click', () => {
      aside.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  /* ---------------- SEARCH PANEL ---------------- */
  const searchBtn = document.getElementById('searchBtn');
  const searchPanel = document.getElementById('searchPanel');
  const searchClose = document.getElementById('searchClose');

  if (searchBtn && searchPanel) {
    searchBtn.addEventListener('click', () => {
      searchPanel.classList.toggle('open');
    });
  }

  if (searchClose && searchPanel) {
    searchClose.addEventListener('click', () => {
      searchPanel.classList.remove('open');
    });
  }

});
