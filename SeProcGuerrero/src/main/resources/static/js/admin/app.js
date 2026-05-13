//admin/app.js
import * as api from './api.js';
import * as ui from './ui.js';
import {
    getParam,
    getViewFromUrl,
    setActiveNav,
    setActiveSubItem,
    syncSidebarWithView,
    syncAddButton,
    loadPanelFromUrl
} from './navigation.js';


let currentView = getParam('view') || 'solicitudes';
let currentEstadoSolicitudes = 'PENDIENTE';
let currentList = [];

let selectedSolicitudId = null;
let currentUserId = null;
let userModalMode = 'EDIT';

function currentIsSolicitudView() {
    return currentView === 'solicitudes';
}

function syncTabsVisually() {
    if (!currentIsSolicitudView()) return;
    document.querySelectorAll('#tabsSolicitudes .tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`#tabsSolicitudes .tab[data-estado="${currentEstadoSolicitudes}"]`);
    if (activeTab) activeTab.classList.add('active');
}

async function loadAndRender() {
    try {
        currentView = getParam('view') || 'solicitudes';
        syncTabsVisually();

        const searchInput = document.getElementById('searchAdmin');
        if (searchInput) searchInput.value = '';

        if (currentIsSolicitudView()) {
            currentList = await api.fetchSolicitudes(currentEstadoSolicitudes);
            ui.renderCards(currentList, 'solicitudesList', 'solicitudesEmpty', 'SOLICITUD', {
                onOpenSolicitud: openDetalleSolicitud
            });
        }
    } catch (e) {
        await ui.showCustomAlert(`No se pudieron cargar datos: ${e.message}`, 'Error');
    }
}

async function openDetalleSolicitud(idSolicitud) {
    try {
        selectedSolicitudId = idSolicitud;

        const dto = await api.fetchDetalleSolicitud(idSolicitud);
        ui.renderDetalleSolicitud(dto);

        try {
            const docs = await api.fetchDocumentacionInicialSolicitud(idSolicitud);
            ui.renderDocumentacionInicialSolicitud(docs);
        } catch (docsError) {
            console.warn('No se pudo cargar documentación inicial:', docsError);
        }

        ui.openModal(
            document.getElementById('detalleModal'),
            document.getElementById('detalleBackdrop')
        );
    } catch (e) {
        await ui.showCustomAlert(`No se pudo cargar detalle: ${e.message}`, 'Error');
    }
}



function bindTabs() {
    document.querySelectorAll('#tabsSolicitudes .tab').forEach(t => {
        if (t.dataset.bound === 'true') return;
        t.dataset.bound = 'true';

        t.addEventListener('click', async () => {
            currentEstadoSolicitudes = t.dataset.estado;
            syncTabsVisually();
            await loadAndRender();
        });
    });
}

function bindSearch() {
    const searchInput = document.getElementById('searchAdmin');
    if (!searchInput || searchInput.dataset.bound === 'true') return;
    searchInput.dataset.bound = 'true';

    searchInput.addEventListener('input', async () => {
        if (!currentIsSolicitudView()) return;

        const q = (searchInput.value || '').toLowerCase().trim();
        if (!q) {
            await loadAndRender();
            return;
        }

        const filtered = currentList.filter(x =>
            (x.nombreEscuela ?? '').toLowerCase().includes(q) ||
            (x.quienEnvia ?? '').toLowerCase().includes(q) ||
            (x.tipoObra ?? '').toLowerCase().includes(q) ||
            (x.tipoEdificacion ?? '').toLowerCase().includes(q)
        );

        ui.renderCards(filtered, 'solicitudesList', 'solicitudesEmpty', 'SOLICITUD', {
            onOpenSolicitud: openDetalleSolicitud
        });
    });
}

function bindPendingApprovalButtons() {
    window.aprobarUsuario = function(btn) {
        const id = btn.dataset.id;
        const select = document.getElementById(`rol-${id}`);
        const hidden = document.getElementById(`rolHidden-${id}`);

        if (!select || !hidden || !select.value) {
            alert('Selecciona un rol.');
            return;
        }

        hidden.value = select.value;
        document.getElementById(`aprobar-${id}`)?.submit();
    };
}

function bindUserRowClicks() {
    document.querySelectorAll('.user-row').forEach(row => {
        if (row.dataset.bound === 'true') return;
        row.dataset.bound = 'true';

        row.addEventListener('click', async () => {
            const id = row.dataset.id;
            if (!id) return;

            currentUserId = id;
            userModalMode = 'EDIT';
            ui.setUserModalMode('EDIT');

            try {
                const dto = await api.fetchUserDetail(id);
                document.getElementById('mNombre').value = dto.nombre || '';
                document.getElementById('mApellido').value = dto.apellido || '';
                document.getElementById('mUsername').value = dto.username || '';
                document.getElementById('mEmail').value = dto.email || '';

                const nombreDelRol = (dto.rol && dto.rol.nombre) ? dto.rol.nombre : (dto.rolNombre || '');
                document.getElementById('mRol').value = nombreDelRol;
                document.getElementById('mRolNombre').value = nombreDelRol;

                const passInput = document.getElementById('mPassword');
                passInput.value = '';
                passInput.placeholder = 'Deja vacío para no cambiar';
				
				const toggleBtn = document.getElementById('togglePassword');
				if (toggleBtn) {
				    toggleBtn.style.display = 'none'; // Asegura que empiece oculto
				    document.getElementById('mPassword').type = 'password'; // Asegura que empiece en modo oculto
				    document.getElementById('togglePasswordIcon').src = '/assets/iconos/ojo-cerrado.png'; // Reinicia el ícono
				}

                ui.openUserModal();
            } catch (e) {
                await ui.showCustomAlert(`No se pudo cargar el usuario: ${e.message}`, 'Error');
            }
        });
    });
}

function openCreateUserModal() {
    const btnAdd = document.getElementById('btnAdd');
    if (btnAdd?.dataset.action !== 'usuario') return;

    const rol = btnAdd.dataset.rol || '';

    currentUserId = null;
    userModalMode = 'CREATE';
    ui.setUserModalMode('CREATE');

    document.getElementById('mNombre').value = '';
    document.getElementById('mApellido').value = '';
    document.getElementById('mUsername').value = '';
    document.getElementById('mEmail').value = '';


    const passInput = document.getElementById('mPassword');
    passInput.value = '';
    passInput.placeholder = 'Escribe una contraseña obligatoria';

    document.getElementById('mRol').value = rol || 'nuevo';
    document.getElementById('mRolNombre').value = rol || '';
	
	const toggleBtn = document.getElementById('togglePassword');
	if (toggleBtn) {
	    toggleBtn.style.display = 'none'; // Asegura que empiece oculto
	    document.getElementById('mPassword').type = 'password'; // Asegura que empiece en modo oculto
	    document.getElementById('togglePasswordIcon').src = '/assets/iconos/ojo-cerrado.png'; // Reinicia el ícono
	}

    ui.openUserModal();
}

async function reloadCurrentUsersPanel() {
    await loadPanelFromUrl({
        href: window.location.href,
        push: false,
        onAfterLoad: () => {
            bindUserRowClicks();
            bindPendingApprovalButtons();
            bindTabs();
            bindSearch();
            loadAndRender();
        }
    });
}

async function handleSaveUser() {
    const payload = {
        nombre: document.getElementById('mNombre').value.trim(),
        apellido: document.getElementById('mApellido').value.trim(),
        username: document.getElementById('mUsername').value.trim(),
        email: document.getElementById('mEmail').value.trim(),
        password: document.getElementById('mPassword').value || '',
        rolNombre: document.getElementById('mRolNombre').value || ''
    };

    if (userModalMode === 'CREATE') {
        if (!payload.password.trim()) {
            await ui.showCustomAlert('Password es obligatorio para crear.', 'Atención');
            return;
        }

        try {
            await api.createUser(payload);
            await ui.showCustomAlert('Usuario creado', 'Éxito');
            ui.closeUserModal();
            await reloadCurrentUsersPanel();
        } catch (e) {
            await ui.showCustomAlert(e.message || 'No se pudo crear.', 'Error');
        }
        return;
    }

    if (!currentUserId) return;

    try {
        await api.updateUser(currentUserId, payload);
        await ui.showCustomAlert('Usuario actualizado', 'Éxito');
        ui.closeUserModal();
        await reloadCurrentUsersPanel();
    } catch (e) {
        await ui.showCustomAlert(e.message || 'No se pudo actualizar.', 'Error');
    }
}

async function handleDeleteUser() {
    if (!currentUserId) return;

    const ok = await ui.showCustomConfirm('¿Seguro que quieres eliminar este usuario?', 'Eliminar usuario');
    if (!ok) return;

    try {
        await api.deleteUser(currentUserId);
        await ui.showCustomAlert('Usuario eliminado', 'Éxito');
        ui.closeUserModal();
        await reloadCurrentUsersPanel();
    } catch (e) {
        await ui.showCustomAlert(e.message || 'No se pudo eliminar.', 'Error');
    }
}

function bindNavigation() {
    document.getElementById('navSolicitudesProyecto')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPanelFromUrl({
            href: '/admin?view=solicitudes',
            push: true,
            onAfterLoad: () => {
                bindTabs();
                bindSearch();
                bindUserRowClicks();
                bindPendingApprovalButtons();
                loadAndRender();
            }
        });
    });

    document.getElementById('navProyectos')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPanelFromUrl({
            href: '/admin?view=proyectos',
            push: true,
            onAfterLoad: () => {
                bindTabs();
                bindSearch();
                bindUserRowClicks();
                bindPendingApprovalButtons();
                loadAndRender();
            }
        });
    });

    document.getElementById('navPendientes')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPanelFromUrl({
            href: '/admin?view=pendientes',
            push: true,
            onAfterLoad: () => {
                bindTabs();
                bindSearch();
                bindUserRowClicks();
                bindPendingApprovalButtons();
                loadAndRender();
            }
        });
    });

    document.getElementById('navPassword')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPanelFromUrl({
            href: '/admin?view=password',
            push: true,
            onAfterLoad: () => {
                bindTabs();
                bindSearch();
                bindUserRowClicks();
                bindPendingApprovalButtons();
                loadAndRender();
            }
        });
    });

    const navUsuarios = document.getElementById('navUsuarios');
    const submenuUsuarios = document.getElementById('submenuUsuarios');

    navUsuarios?.addEventListener('click', () => {
        const isOpen = navUsuarios.getAttribute('data-open') === 'true';
        navUsuarios.setAttribute('data-open', String(!isOpen));
        submenuUsuarios?.classList.toggle('open', !isOpen);
        setActiveNav('navUsuarios');
    });

    document.querySelectorAll('#submenuUsuarios .sub-item').forEach(a => {
        if (a.dataset.bound === 'true') return;
        a.dataset.bound = 'true';

        a.addEventListener('click', async (e) => {
            e.preventDefault();
            const href = a.getAttribute('href');
            if (!href) return;

            setActiveNav('navUsuarios');
            setActiveSubItem(a);
            navUsuarios?.setAttribute('data-open', 'true');
            submenuUsuarios?.classList.add('open');

            currentView = getViewFromUrl(href);
            syncSidebarWithView(currentView);
            syncAddButton(currentView);

            await loadPanelFromUrl({
                href,
                push: true,
                onAfterLoad: () => {
                    bindUserRowClicks();
                    bindPendingApprovalButtons();
                    bindTabs();
                    bindSearch();
                    loadAndRender();
                }
            });
        });
    });

    window.addEventListener('popstate', async (e) => {
        const href = (e.state && e.state.href) ? e.state.href : window.location.href;
        currentView = getViewFromUrl(href);
        syncSidebarWithView(currentView);
        syncAddButton(currentView);

        await loadPanelFromUrl({
            href,
            push: false,
            onAfterLoad: () => {
                bindUserRowClicks();
                bindPendingApprovalButtons();
                bindTabs();
                bindSearch();
                loadAndRender();
            }
        });
    });
}

function initProfilePhoto() {
    const profileBtn = document.getElementById('profileBtn');
    const profileFile = document.getElementById('profileFile');
    const btnViewPhoto = document.getElementById('btnViewPhoto');
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const btnDeletePhoto = document.getElementById('btnDeletePhoto');

    const fotoUrl = profileBtn?.dataset?.foto || '';
    ui.renderProfilePhoto(fotoUrl);

    profileBtn?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ui.toggleProfileMenu();
    });

    btnUploadPhoto?.addEventListener('click', () => {
        ui.closeProfileMenu();
        profileFile?.click();
    });

    btnViewPhoto?.addEventListener('click', () => {
        ui.closeProfileMenu();
        const currentFoto = profileBtn?.dataset?.foto;
        if (currentFoto && !currentFoto.includes('sinFotoPerfil.png')) {
            window.open(currentFoto, '_blank');
        } else {
            ui.showCustomAlert('Aún no has subido una foto de perfil.', 'Ver foto');
        }
    });

    btnDeletePhoto?.addEventListener('click', async () => {
        ui.closeProfileMenu();
        const currentFoto = profileBtn?.dataset?.foto;

        if (!currentFoto || currentFoto.includes('sinFotoPerfil.png')) {
            return ui.showCustomAlert('No tienes una foto de perfil personalizada para eliminar.', 'Aviso');
        }

        const confirmado = await ui.showCustomConfirm('¿Estás seguro de que deseas eliminar tu foto de perfil?', 'Eliminar foto');
        if (!confirmado) return;

        try {
            const data = await api.deleteProfilePhoto();
            const defaultUrl = data?.url || '/assets/iconos/sinFotoPerfil.png';
            ui.renderProfilePhoto(defaultUrl);
            if (profileBtn) profileBtn.dataset.foto = defaultUrl;
            ui.showCustomAlert('Tu foto de perfil ha sido eliminada.', 'Éxito');
        } catch (err) {
            ui.showCustomAlert(err.message, 'Error');
        }
    });

    profileFile?.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            const url = await api.uploadProfilePhoto(file);
            ui.renderProfilePhoto(url);
            if (profileBtn) profileBtn.dataset.foto = url;
        } catch (err) {
            ui.renderProfilePhoto(profileBtn?.dataset?.foto || '');
            await ui.showCustomAlert(err.message || 'Error al subir la foto.', 'Error');
        } finally {
            profileFile.value = '';
        }
    });
}

function bindModalActions() {
    document.getElementById('btnCerrarDetalle')?.addEventListener('click', () => {
        ui.closeModal(document.getElementById('detalleModal'), document.getElementById('detalleBackdrop'));
    });

    document.getElementById('detalleBackdrop')?.addEventListener('click', () => {
        ui.closeModal(document.getElementById('detalleModal'), document.getElementById('detalleBackdrop'));
    });

    document.getElementById('btnCerrarSup')?.addEventListener('click', () => {
        ui.closeModal(document.getElementById('supModal'), document.getElementById('supBackdrop'));
    });

    document.getElementById('supBackdrop')?.addEventListener('click', () => {
        ui.closeModal(document.getElementById('supModal'), document.getElementById('supBackdrop'));
    });

    document.getElementById('btnCerrarMotivo')?.addEventListener('click', () => {
        ui.closeModal(document.getElementById('motivoModal'), document.getElementById('motivoBackdrop'));
    });

    document.getElementById('motivoBackdrop')?.addEventListener('click', () => {
        ui.closeModal(document.getElementById('motivoModal'), document.getElementById('motivoBackdrop'));
    });

    document.getElementById('userModalClose')?.addEventListener('click', () => {
        ui.closeUserModal();
        currentUserId = null;
    });

    document.getElementById('userModalBackdrop')?.addEventListener('click', () => {
        ui.closeUserModal();
        currentUserId = null;
    });

    document.getElementById('btnAprobar')?.addEventListener('click', async () => {
        if (!selectedSolicitudId) return;

        try {
            const sups = await api.fetchSupervisores();
            const selectSupervisor = document.getElementById('selectSupervisor');
            if (selectSupervisor) {
                selectSupervisor.innerHTML = `<option value="" selected disabled>Seleccionar</option>`;
                for (const s of sups) {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.nombre;
                    selectSupervisor.appendChild(opt);
                }
            }

            ui.openModal(document.getElementById('supModal'), document.getElementById('supBackdrop'));
        } catch (e) {
            await ui.showCustomAlert(`No se pudieron cargar supervisores: ${e.message}`, 'Error');
        }
    });

    document.getElementById('btnRechazar')?.addEventListener('click', () => {
        if (!selectedSolicitudId) return;
        const txtMotivo = document.getElementById('txtMotivo');
        if (txtMotivo) txtMotivo.value = '';
        ui.openModal(document.getElementById('motivoModal'), document.getElementById('motivoBackdrop'));
    });

    document.getElementById('btnConfirmarAprobar')?.addEventListener('click', async () => {
        const supId = document.getElementById('selectSupervisor')?.value;
        if (!supId) {
            await ui.showCustomAlert('Selecciona un supervisor', 'Atención');
            return;
        }

        try {
            await api.postAprobar(selectedSolicitudId, supId);
            ui.closeModal(document.getElementById('supModal'), document.getElementById('supBackdrop'));
            ui.closeModal(document.getElementById('detalleModal'), document.getElementById('detalleBackdrop'));
            await loadAndRender();
            await ui.showCustomAlert('Solicitud aprobada', 'Éxito');
        } catch (e) {
            await ui.showCustomAlert(`No se pudo aprobar: ${e.message}`, 'Error');
        }
    });

    document.getElementById('btnConfirmarRechazo')?.addEventListener('click', async () => {
        const motivo = (document.getElementById('txtMotivo')?.value || '').trim();
        if (!motivo) {
            await ui.showCustomAlert('Escribe el motivo', 'Atención');
            return;
        }

        try {
            await api.postRechazar(selectedSolicitudId, motivo);
            ui.closeModal(document.getElementById('motivoModal'), document.getElementById('motivoBackdrop'));
            ui.closeModal(document.getElementById('detalleModal'), document.getElementById('detalleBackdrop'));
            await loadAndRender();
            await ui.showCustomAlert('Solicitud rechazada', 'Éxito');
        } catch (e) {
            await ui.showCustomAlert(`No se pudo rechazar: ${e.message}`, 'Error');
        }
    });

    document.getElementById('btnGuardarUsuario')?.addEventListener('click', handleSaveUser);
    document.getElementById('btnEliminarUsuario')?.addEventListener('click', handleDeleteUser);
    document.getElementById('btnAdd')?.addEventListener('click', openCreateUserModal);

    document.getElementById('formCambiarPassword')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            actual: document.getElementById('passActual')?.value || '',
            nueva: document.getElementById('passNueva')?.value || '',
            repetida: document.getElementById('passRepetida')?.value || ''
        };

        if (!payload.actual || !payload.nueva || !payload.repetida) {
            await ui.showCustomAlert('Completa todos los campos.', 'Atención');
            return;
        }

        if (payload.nueva !== payload.repetida) {
            await ui.showCustomAlert('Las contraseñas nuevas no coinciden.', 'Atención');
            return;
        }

        try {
            await api.changePassword(payload);
            await ui.showCustomAlert('Contraseña actualizada.', 'Éxito');
            e.target.reset();
        } catch (err) {
            await ui.showCustomAlert(err.message || 'No se pudo cambiar la contraseña.', 'Error');
        }
    });
}

function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passInput = document.getElementById('mPassword');
    const toggleIcon = document.getElementById('togglePasswordIcon');

    if (!toggleBtn || !passInput || !toggleIcon) return;

    // Ocultar el botón al inicio por defecto
    toggleBtn.style.display = 'none';

    // Evitar que el evento se asocie múltiples veces
    if (toggleBtn.dataset.bound === 'true') return;
    toggleBtn.dataset.bound = 'true';

    // Escuchar cuando el usuario escribe en el campo
    passInput.addEventListener('input', () => {
        if (passInput.value.length > 0) {
            // Si hay texto, mostramos el botón
            toggleBtn.style.display = 'flex';
        } else {
            // Si está vacío, ocultamos el botón y regresamos el input a tipo "password" por seguridad
            toggleBtn.style.display = 'none';
            passInput.type = 'password';
            toggleIcon.src = '/assets/iconos/ojo-cerrado.png'; // Reiniciamos el ícono al original
        }
    });

    toggleBtn.addEventListener('click', () => {
        // Comprobamos si actualmente está oculta (tipo password)
        const isPassword = passInput.type === 'password';

        // Alternamos el tipo de input
        passInput.type = isPassword ? 'text' : 'password';

        // Cambiamos la imagen del ícono dinámicamente
        if (isPassword) {
            // Si estaba oculta y ahora se ve, mostramos el ojo cerrado
            toggleIcon.src = '/assets/iconos/ojo.png';
        } else {
            // Si se estaba viendo y ahora se oculta, volvemos al ojo normal
            toggleIcon.src = '/assets/iconos/ojo-cerrado.png';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setActiveNav(currentView);
    syncSidebarWithView(currentView);
    syncAddButton(currentView);

    bindNavigation();
    bindTabs();
    bindSearch();
    bindPendingApprovalButtons();
    bindUserRowClicks();
    initProfilePhoto();
    bindModalActions();
    initPasswordToggle();
    loadAndRender();
});

window.addEventListener('panelLoaded', (e) => {
    const view = e.detail?.view || getParam('view') || 'solicitudes';
    currentView = view;

    syncSidebarWithView(currentView);
    syncAddButton(currentView);

    bindTabs();
    bindSearch();
    bindPendingApprovalButtons();
    bindUserRowClicks();
    bindModalActions();
    initPasswordToggle();
    loadAndRender();
});

