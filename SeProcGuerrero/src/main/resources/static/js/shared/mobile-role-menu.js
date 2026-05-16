document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const btnMenu = document.getElementById('btnMenu');

  if (!sidebar || !btnMenu) return;

  btnMenu.addEventListener('click', (event) => {
    event.stopPropagation();
    sidebar.classList.toggle('menu-open');
  });

  document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target)) {
      sidebar.classList.remove('menu-open');
    }
  });

  sidebar.querySelectorAll('.nav a, .nav form button[type="submit"]').forEach(item => {
    item.addEventListener('click', () => {
      sidebar.classList.remove('menu-open');
    });
  });
});