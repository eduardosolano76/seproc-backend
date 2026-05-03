// js/seproc/navigation.js

export function switchView(viewName) {
    // 1. Ocultar todas las secciones
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => {
        view.classList.add('hidden');
    });

    const activeView = document.getElementById('view-' + viewName);
    if(activeView) {
        activeView.classList.remove('hidden');
    }

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeNavLink = document.getElementById('nav-' + viewName);
    if(activeNavLink) {
        activeNavLink.classList.add('active');
    }
}  