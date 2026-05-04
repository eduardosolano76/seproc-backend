// js/seprocIndex/navigation.js

export function switchView(viewName) {
    // Ocultar todas las secciones
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => {
        view.classList.add('hidden');
    });
	
	// Mostrar la sección activa
    const activeView = document.getElementById('view-' + viewName);
    if(activeView) {
        activeView.classList.remove('hidden');
    }
	
	// Actualizar la clase 'active' en los enlaces
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeNavLink = document.getElementById('nav-' + viewName);
    if(activeNavLink) {
        activeNavLink.classList.add('active');
    }
	
	// Regresar el scroll hasta arriba suavemente
	window.scrollTo({
	        top: 0,
	        behavior: 'smooth' 
	    });
}  