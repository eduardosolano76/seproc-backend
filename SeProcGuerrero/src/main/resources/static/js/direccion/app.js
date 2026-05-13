import * as api from './api.js';
import * as ui from './ui.js';
import { getParam, getViewFromUrl, syncSidebarWithView, loadPanelFromUrl } from './navigation.js';

let currentView = getParam('view') || 'proyectos';

function bindNavigation() {
  document.getElementById('navProyectos')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await loadPanelFromUrl({
      href: '/direccion?view=proyectos',
      push: true,
      onAfterLoad: () => {
        bindSearch();
      }
    });
  });

  document.getElementById('navPassword')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await loadPanelFromUrl({
      href: '/direccion?view=password',
      push: true,
      onAfterLoad: () => {
        bindSearch();
        bindPasswordForm();
      }
    });
  });

  window.addEventListener('popstate', async (e) => {
    const href = (e.state && e.state.href) ? e.state.href : window.location.href;
    currentView = getViewFromUrl(href);
    syncSidebarWithView(currentView);

    await loadPanelFromUrl({
      href,
      push: false,
      onAfterLoad: () => {
        bindSearch();
        bindPasswordForm();
      }
    });
  });
}

function bindHamburger() {
  const btn = document.getElementById('btnMenu');
  const sidebar = document.getElementById('sidebar');
  btn?.addEventListener('click', () => sidebar?.classList.toggle('menu-open'));
}

function bindSearch() {
  const input = document.getElementById('searchDireccion');
  if (!input || input.dataset.bound === 'true') return;
  input.dataset.bound = 'true';

  input.addEventListener('input', () => {
    window.dispatchEvent(new CustomEvent('direccionSearch', { detail: { q: input.value || '' } }));
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

  btnViewPhoto?.addEventListener('click', async () => {
    ui.closeProfileMenu();
    const currentFoto = profileBtn?.dataset?.foto;
    if (currentFoto && !currentFoto.includes('sinFotoPerfil.png')) window.open(currentFoto, '_blank');
    else await ui.showCustomAlert('Aún no has subido una foto de perfil.', 'Ver foto');
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

function bindPasswordForm() {
  const form = document.getElementById('formCambiarPassword');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async (e) => {
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
      form.reset();
    } catch (err) {
      await ui.showCustomAlert(err.message || 'No se pudo cambiar la contraseña.', 'Error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  syncSidebarWithView(currentView);
  bindNavigation();
  bindHamburger();
  bindSearch();
  initProfilePhoto();
  bindPasswordForm();
});



window.addEventListener('panelLoaded', (e) => {
  currentView = e.detail?.view || getParam('view') || 'proyectos';
  syncSidebarWithView(currentView);
  bindSearch();
  bindPasswordForm();
});
