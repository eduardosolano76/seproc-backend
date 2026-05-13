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
let currentEstadoProyectos = 'ACTIVO';
let currentList = [];

let selectedSolicitudId = null;
let selectedProyectoId = null;

let currentUserId = null;
let userModalMode = 'EDIT';

function currentIsProjectView() {
  return currentView === 'proyectos';
}

function currentIsSolicitudView() {
  return currentView === 'solicitudes';
}

function syncTabsVisually() {
  if (currentIsSolicitudView()) {
    document.querySelectorAll('#tabsSolicitudes .tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`#tabsSolicitudes .tab[data-estado="${currentEstadoSolicitudes}"]`);
    if (activeTab) activeTab.classList.add('active');
  }
}

function drawCurrentList() {
  if (currentIsProjectView()) {
    return;
  }

  if (currentIsSolicitudView()) {
    ui.renderCards(currentList, 'solicitudesList', 'solicitudesEmpty', 'SOLICITUD', {
      onOpenSolicitud: openDetalleSolicitud
    });
  }
}

async function loadAndRender() {
  try {
    currentView = getParam('view') || 'solicitudes';
    syncTabsVisually();

    const searchInput = document.getElementById('searchCentral');
    if (searchInput) searchInput.value = '';

    if (currentIsProjectView()) {
      return;
    }

    if (currentIsSolicitudView()) {
      currentList = await api.fetchSolicitudes(currentEstadoSolicitudes);
      drawCurrentList();
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



/* foto de perfil */
function initProfilePhoto() {
  const profileBtn = document.getElementById('profileBtn');
  const profileFile = document.getElementById('profileFile');

  const btnViewPhoto = document.getElementById('btnViewPhoto');
  const btnUploadPhoto = document.getElementById('btnUploadPhoto');
  const btnDeletePhoto = document.getElementById('btnDeletePhoto');

  const fotoUrl = profileBtn?.dataset?.foto || '';
  ui.renderProfilePhoto(fotoUrl);

  // 1. Abrir/Cerrar menú
  profileBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    ui.toggleProfileMenu();
  });

  // 2. Subir foto
  btnUploadPhoto?.addEventListener('click', () => {
    ui.closeProfileMenu();
    profileFile?.click();
  });

  // 3. Ver foto
  btnViewPhoto?.addEventListener('click', () => {
    ui.closeProfileMenu();
    const currentFoto = profileBtn?.dataset?.foto;
    if (currentFoto && !currentFoto.includes('sinFotoPerfil.png')) {
      window.open(currentFoto, '_blank');
    } else {
      ui.showCustomAlert("Aún no has subido una foto de perfil.", "Ver foto");
    }
  });

  // 4. Eliminar foto
  btnDeletePhoto?.addEventListener('click', async () => {
    ui.closeProfileMenu();
    const currentFoto = profileBtn?.dataset?.foto;

    if (!currentFoto || currentFoto.includes('sinFotoPerfil.png')) {
      return ui.showCustomAlert("No tienes una foto de perfil personalizada para eliminar.", "Aviso");
    }

    const confirmado = await ui.showCustomConfirm("¿Estás seguro de que deseas eliminar tu foto de perfil?", "Eliminar foto");
    if (!confirmado) return;

    try {
      const data = await api.deleteProfilePhoto();
      const defaultUrl = data?.url || '/assets/iconos/sinFotoPerfil.png';
      ui.renderProfilePhoto(defaultUrl);
      if (profileBtn) profileBtn.dataset.foto = defaultUrl;
      ui.showCustomAlert("Tu foto de perfil ha sido eliminada.", "Éxito");
    } catch (err) {
      ui.showCustomAlert(err.message, "Error");
    }
  });

  // 5. Manejar cambio de archivo
  profileFile?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const profileImg = document.getElementById('profileImg');
    const profileFallback = document.getElementById('profileFallback');
    profileImg.src = URL.createObjectURL(file);
    profileImg.style.display = 'block';
    profileFallback.style.display = 'none';

    try {
      const url = await api.uploadProfilePhoto(file);
      ui.renderProfilePhoto(url);

      if (profileBtn) {
        profileBtn.dataset.foto = url;
      }
    } catch (err) {
      ui.renderProfilePhoto(profileBtn?.dataset?.foto || '');
      await ui.showCustomAlert(err.message || 'Error al subir la foto.', 'Error');
    } finally {
      profileFile.value = '';
    }
  });
}

/* usuarios */
function bindUserRowClicks() {
  document.querySelectorAll('tr.user-row').forEach(tr => {
    if (tr.dataset.bound === 'true') return;
    tr.dataset.bound = 'true';
    tr.style.cursor = 'pointer';

    tr.addEventListener('click', () => {
      const id = tr.getAttribute('data-id');
      if (id) showUserDetail(id);
    });
  });
}

function getRoleNameFromView(view) {
  return view === 'usuarios-supervisores' ? 'supervisor'
    : view === 'usuarios-constructores' ? 'contratista'
    : view === 'usuarios-directores' ? 'direccion'
    : '';
}

async function showUserDetail(id) {
  try {
    const u = await api.fetchUserDetail(id);

    currentUserId = id;
    userModalMode = 'EDIT';
    ui.setUserModalMode('EDIT');

    document.getElementById('mNombre').value = u.nombre ?? '';
    document.getElementById('mApellido').value = u.apellido ?? '';
    document.getElementById('mUsername').value = u.username ?? '';
    document.getElementById('mEmail').value = u.email ?? '';
    document.getElementById('mRol').value = (u.rol && u.rol.nombre) ? u.rol.nombre : 'sin rol';
    document.getElementById('mRolNombre').value = getRoleNameFromView(getParam('view') || '');
    document.getElementById('mPassword').value = '';

    ui.openUserModal();
  } catch (e) {
    await ui.showCustomAlert('No se pudo cargar el usuario.', 'Error');
  }
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
  document.getElementById('mPassword').value = '';
  document.getElementById('mRol').value = rol || 'nuevo';
  document.getElementById('mRolNombre').value = rol || '';

  ui.openUserModal();
}

async function reloadCurrentUsersPanel() {
  await loadPanelFromUrl({
    href: window.location.href,
    push: false,
    onAfterLoad: () => {
      bindUserRowClicks();
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

  const ok = window.confirm('¿Seguro que quieres eliminar este usuario?');
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

/* Navegacion*/
function bindNavigation() {
  document.getElementById('navSolicitudes')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await loadPanelFromUrl({
      href: '/central?view=solicitudes',
      push: true,
      onAfterLoad: () => { bindTabs(); loadAndRender(); }
    });
  });

  document.getElementById('navProyectos')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await loadPanelFromUrl({
      href: '/central?view=proyectos',
      push: true,
      onAfterLoad: () => { bindTabs(); loadAndRender(); }
    });
  });

  document.getElementById('navPassword')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await loadPanelFromUrl({
      href: '/central?view=password',
      push: true
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
        }
      });
    });
  });

  window.addEventListener('popstate', async (e) => {
    const href = (e.state && e.state.href) ? e.state.href : window.location.href;
    const view = getViewFromUrl(href);

    currentView = view;
    syncSidebarWithView(currentView);
    syncAddButton(currentView);

    await loadPanelFromUrl({
      href,
      push: false,
      onAfterLoad: () => {
        bindUserRowClicks();
        bindTabs();
        loadAndRender();
      }
    });
  });
}

/* tabs y busquedas */
function bindTabs() {
  document.querySelectorAll('#tabsSolicitudes .tab').forEach(t => {
    if (t.dataset.bound === 'true') return;
    t.dataset.bound = 'true';

    t.addEventListener('click', async () => {
      document.querySelectorAll('#tabsSolicitudes .tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentEstadoSolicitudes = t.dataset.estado; // Guarda en solicitudes
      await loadAndRender();
    });
  });
}

function bindSearch() {
  const searchInput = document.getElementById('searchCentral');
  searchInput?.addEventListener('input', () => {
    if (currentIsProjectView()) return;
    if (!currentIsSolicitudView()) return;

    const q = (searchInput.value || '').toLowerCase().trim();

    if (!q) {
      drawCurrentList();
      return;
    }

    const filtered = currentList.filter(x =>
      (x.nombreEscuela ?? '').toLowerCase().includes(q) ||
      (x.constructor ?? '').toLowerCase().includes(q) ||
      (x.supervisor ?? '').toLowerCase().includes(q)
    );

    ui.renderCards(filtered, 'solicitudesList', 'solicitudesEmpty', 'SOLICITUD', {
      onOpenSolicitud: openDetalleSolicitud
    });
  });
}

/* modales */
function bindModalActions() {
  document.getElementById('btnCerrarDetalle')?.addEventListener('click', () => {
    ui.closeModal(
      document.getElementById('detalleModal'),
      document.getElementById('detalleBackdrop')
    );
  });

  document.getElementById('detalleBackdrop')?.addEventListener('click', () => {
    ui.closeModal(
      document.getElementById('detalleModal'),
      document.getElementById('detalleBackdrop')
    );
  });

  document.getElementById('btnCerrarSup')?.addEventListener('click', () => {
    ui.closeModal(
      document.getElementById('supModal'),
      document.getElementById('supBackdrop')
    );
  });

  document.getElementById('supBackdrop')?.addEventListener('click', () => {
    ui.closeModal(
      document.getElementById('supModal'),
      document.getElementById('supBackdrop')
    );
  });

  document.getElementById('btnCerrarMotivo')?.addEventListener('click', () => {
    ui.closeModal(
      document.getElementById('motivoModal'),
      document.getElementById('motivoBackdrop')
    );
  });

  document.getElementById('motivoBackdrop')?.addEventListener('click', () => {
    ui.closeModal(
      document.getElementById('motivoModal'),
      document.getElementById('motivoBackdrop')
    );
  });

  document.getElementById('userModalClose')?.addEventListener('click', () => {
    ui.closeUserModal();
    currentUserId = null;
  });

  document.getElementById('userModalBackdrop')?.addEventListener('click', () => {
    ui.closeUserModal();
    currentUserId = null;
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const motivoModal = document.getElementById('motivoModal');
    const supModal = document.getElementById('supModal');
    const detalleModal = document.getElementById('detalleModal');
    const userModal = document.getElementById('userModal');

    if (motivoModal?.classList.contains('open')) {
      ui.closeModal(motivoModal, document.getElementById('motivoBackdrop'));
    } else if (supModal?.classList.contains('open')) {
      ui.closeModal(supModal, document.getElementById('supBackdrop'));
    } else if (detalleModal?.classList.contains('open')) {
      ui.closeModal(detalleModal, document.getElementById('detalleBackdrop'));
    } else if (userModal?.classList.contains('open')) {
      ui.closeUserModal();
    }
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

      ui.openModal(
        document.getElementById('supModal'),
        document.getElementById('supBackdrop')
      );
    } catch (e) {
      await ui.showCustomAlert(`No se pudieron cargar supervisores: ${e.message}`, 'Error');
    }
  });

  document.getElementById('btnRechazar')?.addEventListener('click', () => {
    if (!selectedSolicitudId) return;
    const txtMotivo = document.getElementById('txtMotivo');
    if (txtMotivo) txtMotivo.value = '';

    ui.openModal(
      document.getElementById('motivoModal'),
      document.getElementById('motivoBackdrop')
    );
  });

  document.getElementById('btnConfirmarAprobar')?.addEventListener('click', async () => {
    const supId = document.getElementById('selectSupervisor')?.value;
    if (!supId) {
      await ui.showCustomAlert('Selecciona un supervisor', 'Atención');
      return;
    }

    try {
      await api.postAprobar(selectedSolicitudId, supId);
      ui.closeModal(
        document.getElementById('supModal'),
        document.getElementById('supBackdrop')
      );
      ui.closeModal(
        document.getElementById('detalleModal'),
        document.getElementById('detalleBackdrop')
      );
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
      ui.closeModal(
        document.getElementById('motivoModal'),
        document.getElementById('motivoBackdrop')
      );
      ui.closeModal(
        document.getElementById('detalleModal'),
        document.getElementById('detalleBackdrop')
      );
      await loadAndRender();
      await ui.showCustomAlert('Solicitud rechazada', 'Éxito');
    } catch (e) {
      await ui.showCustomAlert(`No se pudo rechazar: ${e.message}`, 'Error');
    }
  });

  document.getElementById('btnProyectoActivo')?.addEventListener('click', async () => {
    if (!selectedProyectoId) return;
    try {
      await api.cambiarEstadoProyecto(selectedProyectoId, 'ACTIVO');
      ui.closeModal(
        document.getElementById('detalleModal'),
        document.getElementById('detalleBackdrop')
      );
      await loadAndRender();
      await ui.showCustomAlert('Proyecto actualizado a ACTIVO', 'Éxito');
    } catch (e) {
      await ui.showCustomAlert(`No se pudo actualizar: ${e.message}`, 'Error');
    }
  });

  document.getElementById('btnProyectoInactivo')?.addEventListener('click', async () => {
    if (!selectedProyectoId) return;
    try {
      await api.cambiarEstadoProyecto(selectedProyectoId, 'INACTIVO');
      ui.closeModal(
        document.getElementById('detalleModal'),
        document.getElementById('detalleBackdrop')
      );
      await loadAndRender();
      await ui.showCustomAlert('Proyecto actualizado a INACTIVO', 'Éxito');
    } catch (e) {
      await ui.showCustomAlert(`No se pudo actualizar: ${e.message}`, 'Error');
    }
  });

  document.getElementById('btnProyectoFinalizado')?.addEventListener('click', async () => {
    if (!selectedProyectoId) return;
    try {
      await api.cambiarEstadoProyecto(selectedProyectoId, 'FINALIZADO');
      ui.closeModal(
        document.getElementById('detalleModal'),
        document.getElementById('detalleBackdrop')
      );
      await loadAndRender();
      await ui.showCustomAlert('Proyecto actualizado a FINALIZADO', 'Éxito');
    } catch (e) {
      await ui.showCustomAlert(`No se pudo actualizar: ${e.message}`, 'Error');
    }
  });

  document.getElementById('btnGuardarUsuario')?.addEventListener('click', handleSaveUser);
  document.getElementById('btnEliminarUsuario')?.addEventListener('click', handleDeleteUser);
  document.getElementById('btnAdd')?.addEventListener('click', openCreateUserModal);
}

/* contraseña */
function bindPasswordForm() {
  document.addEventListener('submit', async (e) => {
    if (e.target.id !== 'formCambiarPassword') return;

    e.preventDefault();

    const passActual = document.getElementById('passActual')?.value || '';
    const passNueva = document.getElementById('passNueva')?.value || '';
    const passRepetida = document.getElementById('passRepetida')?.value || '';

    const tieneNumero = /[0-9]/.test(passNueva);
    const tieneEspecial = /[^A-Za-z0-9]/.test(passNueva);

    if (passNueva.length < 8 || !tieneNumero || !tieneEspecial) {
      await ui.showCustomAlert(
        'La nueva contraseña debe tener 8 caracteres como mínimo, 1 número y 1 caracter especial.',
        'Contraseña débil'
      );
      return;
    }

    if (passNueva !== passRepetida) {
      await ui.showCustomAlert('Las contraseñas nuevas no coinciden.', 'Error');
      return;
    }

    try {
      await api.changePassword({ passActual, passNueva });
      await ui.showCustomAlert('Tu contraseña ha sido actualizada correctamente.', 'Éxito');
      document.getElementById('formCambiarPassword')?.reset();
    } catch (e) {
      await ui.showCustomAlert(e.message || 'Ocurrió un error al cambiar la contraseña.', 'Error');
    }
  });
}

/* init*/
document.addEventListener('DOMContentLoaded', async () => {
  syncSidebarWithView(currentView);
  syncAddButton(currentView);

  bindNavigation();
  bindTabs();
  bindSearch();
  bindModalActions();
  bindPasswordForm();
  bindUserRowClicks();
  initProfilePhoto();

  await loadAndRender();
});