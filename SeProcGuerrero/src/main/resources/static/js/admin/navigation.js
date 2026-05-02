//admin/navigation.js
import { closeMobileMenu } from './ui.js';

export function getParam(name, href = window.location.href) {
    const u = new URL(href, window.location.origin);
    return u.searchParams.get(name);
}

export function getViewFromUrl(href = window.location.href) {
    return getParam('view', href) || 'solicitudes';
}

export function setActiveNav(id) {
    document.querySelectorAll('.nav .nav-item').forEach(x => x.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}

export function setActiveSubItem(clicked) {
    document.querySelectorAll('#submenuUsuarios .sub-item').forEach(x => x.classList.remove('active'));
    clicked?.classList.add('active');
}

export function syncSidebarWithView(view) {
    const navUsuarios = document.getElementById('navUsuarios');
    const submenuUsuarios = document.getElementById('submenuUsuarios');

    if (view.startsWith('usuarios-')) {
        setActiveNav('navUsuarios');
        navUsuarios?.setAttribute('data-open', 'true');
        submenuUsuarios?.classList.add('open');

        document.querySelectorAll('#submenuUsuarios .sub-item').forEach(x => x.classList.remove('active'));
        const link = document.querySelector(`#submenuUsuarios .sub-item[href$="view=${view}"]`);
        link?.classList.add('active');
        return;
    }

    document.querySelectorAll('#submenuUsuarios .sub-item').forEach(x => x.classList.remove('active'));
    navUsuarios?.setAttribute('data-open', 'false');
    submenuUsuarios?.classList.remove('open');

    if (view === 'solicitudes') setActiveNav('navSolicitudesProyecto');
    else if (view === 'proyectos') setActiveNav('navProyectos');
    else if (view === 'pendientes') setActiveNav('navPendientes');
    else if (view === 'password') setActiveNav('navPassword');
}

export function syncAddButton(view) {
    const btnAdd = document.getElementById('btnAdd');
    const btnAddIcon = document.getElementById('btnAddIcon');
    if (!btnAdd || !btnAddIcon) return;

    if (view.startsWith('usuarios-')) {
        btnAdd.style.display = 'inline-flex';
        btnAdd.dataset.action = 'usuario';
        btnAdd.dataset.rol =
            view === 'usuarios-supervisores' ? 'supervisor' :
                view === 'usuarios-constructores' ? 'contratista' :
                    view === 'usuarios-directores' ? 'direccion' :
                        view === 'usuarios-central' ? 'central' :
                            view === 'usuarios-administrador' ? 'administrador' : '';
        btnAddIcon.src = '/assets/iconos/agregar-usuario.png';
        return;
    }

    btnAdd.style.display = 'none';
    btnAdd.dataset.action = '';
    btnAdd.dataset.rol = '';
}

export async function loadPanelFromUrl({ href, push = true, onAfterLoad = null }) {
    const panelContent = document.getElementById('panelContent');
    const sectionTitle = document.getElementById('sectionTitle');
    const sectionSubtitle = document.getElementById('sectionSubtitle');

    if (!panelContent) {
        window.location.href = href;
        return;
    }

    const view = getViewFromUrl(href);
    panelContent.innerHTML = `<div class="panel-sub">Cargando...</div>`;

    try {
        const res = await fetch(href, {
            cache: 'no-store',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newPanelContent = doc.getElementById('panelContent');

        if (newPanelContent) panelContent.innerHTML = newPanelContent.innerHTML;
        else panelContent.innerHTML = html;

        if (sectionTitle && sectionSubtitle) {
            if (view === 'solicitudes') {
                sectionTitle.textContent = 'Solicitudes de proyectos';
                sectionSubtitle.textContent = 'Revisa y decide solicitudes de proyecto';
            } else if (view === 'proyectos') {
                sectionTitle.textContent = 'Proyectos';
                sectionSubtitle.textContent = 'Consulta y administra los proyectos registrados';
            } else if (view === 'pendientes') {
                sectionTitle.textContent = 'Solicitudes pendientes';
                sectionSubtitle.textContent = 'Aprueba o rechaza solicitudes de acceso al sistema';
            } else if (view === 'password') {
                sectionTitle.textContent = 'Cambiar contraseña';
                sectionSubtitle.textContent = 'Actualiza tu contraseña del sistema';
            } else {
                sectionTitle.textContent = 'Usuarios';
                sectionSubtitle.textContent = 'Gestiona usuarios del sistema';
            }
        }

        if (push) history.pushState({ href }, '', href);

        syncSidebarWithView(view);
        syncAddButton(view);
        closeMobileMenu();

        if (typeof onAfterLoad === 'function') onAfterLoad(view);
        window.dispatchEvent(new CustomEvent('panelLoaded', { detail: { view } }));
    } catch (e) {
        window.location.href = href;
    }
}