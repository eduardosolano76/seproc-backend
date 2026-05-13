//app.js
import * as api from './api.js';
import * as ui from './ui.js';
import { getParam, getViewFromUrl, syncSidebarWithView, loadPanelFromUrl } from './navigation.js';
import { abrirModalDocumentacionInicial } from '../modalDocumentacion/documentacion-inicial-modal.js';

let currentView = getParam('view') || 'proyectos';
let currentEstado = 'ACTIVO';
let currentList = [];
let currentProcesoDto = null;
let currentBloqueKey = null;
let bloqueStack = [];
let currentEtapaKey = null;
let currentEtapaNombre = null;

function updateCurrentEstadoByView() {
    if (currentView !== 'proyectos') return;

    currentEstado = currentEstado && ['ACTIVO', 'INACTIVO', 'FINALIZADO'].includes(currentEstado)
        ? currentEstado
        : 'ACTIVO';
}

function syncTabsVisually() {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.tabs .tab[data-estado="${currentEstado}"]`);
    if (activeTab) activeTab.classList.add('active');
}

async function loadAndRender() {
    showSupervisorView('projects');
    if (currentView !== 'proyectos') return;

    try {
        updateCurrentEstadoByView();
        syncTabsVisually();

        // Limpiamos el buscador al recargar la vista
        const searchSupervisor = document.getElementById('searchSupervisor');
        if (searchSupervisor) searchSupervisor.value = '';

        currentList = await api.fetchProyectos(currentEstado);
        ui.renderCards(currentList, openDetalleProyecto);
    } catch (e) {
        await ui.showCustomAlert(`No se pudieron cargar los proyectos: ${e.message}`, 'Error');
    }
}

async function openDetalleProyecto(idProyecto) {
    try {
        const dto = await api.fetchDetalleProyecto(idProyecto);
        currentProcesoDto = dto;
        bloqueStack = [];
        currentBloqueKey = null;

        ui.renderProcesoSupervisor(dto);
        showSupervisorView('proceso');
        bindPanelEventsSupervisor();

        const procesoView = document.getElementById('supervisorProcesoView');
        if (procesoView) procesoView.scrollTop = 0;
    } catch (e) {
        await ui.showCustomAlert(`No se pudo cargar el detalle: ${e.message}`, 'Error');
    }
}

function bindTabs() {
    document.querySelectorAll('#tabsSupervisor .tab').forEach(tab => {
        if (tab.dataset.bound === 'true') return;
        tab.dataset.bound = 'true';

        tab.addEventListener('click', async () => {
            currentEstado = tab.dataset.estado;
            await loadAndRender();
        });
    });
}

function bindSearch() {
    const searchSupervisor = document.getElementById('searchSupervisor');

    searchSupervisor?.addEventListener('input', () => {
        const q = (searchSupervisor.value || '').toLowerCase().trim();

        if (!q) {
            ui.renderCards(currentList, openDetalleProyecto);
            return;
        }

        const filtered = currentList.filter(x =>
            (x.nombreEscuela ?? '').toLowerCase().includes(q) ||
            (x.constructor ?? '').toLowerCase().includes(q)
        );

        ui.renderCards(filtered, openDetalleProyecto);
    });
}

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

    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        const detalleModal = document.getElementById('detalleModal');
        if (detalleModal?.classList.contains('open')) {
            ui.closeModal(
                document.getElementById('detalleModal'),
                document.getElementById('detalleBackdrop')
            );
        }
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

        // Previsualización inmediata
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

function bindNavigation() {
    document.getElementById('navProyectos')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPanelFromUrl({
            href: '/supervisor?view=proyectos',
            push: true,
            onAfterLoad: (newView) => {
                currentView = newView;
                bindTabs();
                loadAndRender();
            }
        });
    });

    document.getElementById('navPassword')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadPanelFromUrl({
            href: '/supervisor?view=password',
            push: true,
            onAfterLoad: (newView) => {
                currentView = newView;
            }
        });
    });

    window.addEventListener('popstate', async (e) => {
        const href = (e.state && e.state.href) ? e.state.href : window.location.href;
        const view = getViewFromUrl(href);

        currentView = view;
        syncSidebarWithView(currentView);

        await loadPanelFromUrl({
            href,
            push: false,
            onAfterLoad: () => {
                bindTabs();
                loadAndRender();
            }
        });
    });
}

function bindPanelEventsSupervisor() {
    const btnBackProceso = document.getElementById('btnBackProcesoSupervisor');
    if (btnBackProceso) btnBackProceso.onclick = volverAListaProyectosSupervisor;

    const btnBackBloque = document.getElementById('btnBackBloqueSupervisor');
    if (btnBackBloque) btnBackBloque.onclick = volverAProcesoSupervisor;

    const btnBackEtapa = document.getElementById('btnBackEtapaSupervisor');
    if (btnBackEtapa) btnBackEtapa.onclick = volverABloqueSupervisor;

    const btnBackHistorial = document.getElementById('btnBackHistorialSupervisor');
    if (btnBackHistorial) btnBackHistorial.onclick = volverAEtapaSupervisor;

    const btnHistory = document.getElementById('btnHistorySupervisor');
    if (btnHistory) btnHistory.onclick = openHistorialSupervisor;

    const processContent = document.getElementById('supervisorProcesoContent');
    if (processContent) {
        const bloques = processContent.querySelectorAll('.process-mini-stage[data-bloque]');
        bloques.forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();

                if (estado === 'locked') return;

                openBloqueSupervisor(btn.dataset.bloque);
            };
        });
    }

    const bloqueContent = document.getElementById('supervisorBloqueContent');
    if (bloqueContent) {
        const toggles = bloqueContent.querySelectorAll('.structure-accordion-toggle');
        toggles.forEach(toggle => {
            toggle.onclick = () => {
                const item = toggle.closest('.structure-accordion');
                if (item) item.classList.toggle('open');
            };
        });

        const subBloques = bloqueContent.querySelectorAll('.process-mini-stage[data-subbloque]');
        subBloques.forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();

                if (estado === 'locked') return;

                openSubBloqueSupervisor(btn.dataset.subbloque);
            };
        });

        const etapas = bloqueContent.querySelectorAll('.process-mini-stage[data-etapa]');
        etapas.forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();

                if (estado === 'locked') return;

                openEtapaSupervisor(
                    btn.dataset.etapa,
                    btn.dataset.nombre || btn.textContent.trim()
                );
            };
        });
    }

    const btnSendObservation = document.getElementById('btnSendObservationSupervisor');
    if (btnSendObservation) {
        btnSendObservation.onclick = async () => {
            const txt = document.getElementById('txtObservationSupervisor');
            const msg = txt?.value?.trim() || '';

            if (!msg) {
                await ui.showCustomAlert('Para devolver el reporte, debes escribir el motivo o las observaciones en la caja de texto.', 'Aviso');
                return;
            }

            const confirmado = await ui.showCustomConfirm(
                '¿Estás seguro de que deseas devolver este reporte con las observaciones ingresadas?',
                'Confirmar devolución'
            );

            if (!confirmado) return;

            try {
                await api.observarEtapa(currentProcesoDto.idProyecto, currentEtapaKey, msg);
                await ui.showCustomAlert('Observación enviada exitosamente.', 'Éxito');
                await openEtapaSupervisor(currentEtapaKey, currentEtapaNombre);
            } catch (e) {
                await ui.showCustomAlert(e.message, 'Error');
            }
        };
    }

    const btnApproveReport = document.getElementById('btnApproveReportSupervisor');
    if (btnApproveReport) {
        btnApproveReport.onclick = async () => {
            const txt = document.getElementById('txtObservationSupervisor');
            const msg = txt?.value?.trim() || '';

            if (msg) {
                await ui.showCustomAlert('Has escrito una observación, pero estás intentando aprobar el reporte. Borra el texto si deseas aprobar, o utiliza el botón "Devolver reporte" para enviar la corrección.', 'Aviso');
                return;
            }

            const confirmado = await ui.showCustomConfirm(
                '¿Estás seguro de que deseas aprobar este reporte? Esta acción marcará la etapa como completada.',
                'Confirmar aprobación'
            );

            if (!confirmado) return;

            try {
                await api.aprobarEtapa(currentProcesoDto.idProyecto, currentEtapaKey);
                await ui.showCustomAlert('Etapa aprobada correctamente.', 'Éxito');

                const dto = await api.fetchDetalleProyecto(currentProcesoDto.idProyecto);
                currentProcesoDto = dto;
                bloqueStack = [];
                currentBloqueKey = null;

                ui.renderProcesoSupervisor(dto);
                showSupervisorView('proceso');
                bindPanelEventsSupervisor();
            } catch (e) {
                await ui.showCustomAlert(e.message, 'Error');
            }
        };
    }

	document.querySelectorAll('[data-doc-inicial]').forEach(btn => {
	  btn.onclick = () => {
	    abrirDocumentacionInicialSupervisor(btn.dataset.docInicial);
	  };
	});

	document.querySelectorAll('[data-more-trigger]').forEach(btn => {
	  btn.onclick = (ev) => {
	    ev.stopPropagation();

	    document.querySelectorAll('.project-more-menu.open')
	      .forEach(menu => {
	        if (menu !== btn.parentElement?.querySelector('.project-more-menu')) {
	          menu.classList.remove('open');
	        }
	      });

	    const menu = btn.parentElement?.querySelector('.project-more-menu');
	    menu?.classList.toggle('open');
	  };
	});

	document.querySelectorAll('[data-more-doc]').forEach(btn => {
	  btn.onclick = () => {
	    document.querySelectorAll('.project-more-menu.open')
	      .forEach(menu => menu.classList.remove('open'));

	    abrirDocumentacionInicialSupervisor(btn.dataset.moreDoc);
	  };
	});
	
}

async function abrirDocumentacionInicialSupervisor(idProyecto) {
  try {
    const data = await api.fetchDocumentacionInicialProyecto(idProyecto);
    abrirModalDocumentacionInicial(data, { puedeSubir: false });
  } catch (e) {
    await ui.showCustomAlert(
      'No se pudo cargar la documentación inicial: ' + e.message,
      'Error'
    );
  }
}

function showSupervisorView(viewName) {
    const projectsView = document.getElementById('supervisorProjectsView');
    const passwordView = document.getElementById('supervisorPasswordView');
    const procesoView = document.getElementById('supervisorProcesoView');
    const bloqueView = document.getElementById('supervisorBloqueView');
    const etapaView = document.getElementById('supervisorEtapaView');
    const historialView = document.getElementById('supervisorHistorialView');

    if (projectsView) projectsView.style.display = viewName === 'projects' ? 'block' : 'none';
    if (passwordView) passwordView.style.display = viewName === 'password' ? 'block' : 'none';
    if (procesoView) procesoView.style.display = viewName === 'proceso' ? 'block' : 'none';
    if (bloqueView) bloqueView.style.display = viewName === 'bloque' ? 'block' : 'none';
    if (etapaView) etapaView.style.display = viewName === 'etapa' ? 'block' : 'none';
    if (historialView) historialView.style.display = viewName === 'historial' ? 'block' : 'none';
}

function volverAListaProyectosSupervisor() {
    bloqueStack = [];
    currentBloqueKey = null;
    currentProcesoDto = null;
    showSupervisorView('projects');
    loadAndRender();
}

function volverAProcesoSupervisor() {
    if (!currentProcesoDto) {
        showSupervisorView('proceso');
        return;
    }

    if (bloqueStack.length > 0) {
        currentBloqueKey = bloqueStack.pop();
        ui.renderBloqueSupervisor(currentProcesoDto, currentBloqueKey);
        showSupervisorView('bloque');
        bindPanelEventsSupervisor();

        const bloqueView = document.getElementById('supervisorBloqueView');
        if (bloqueView) bloqueView.scrollTop = 0;
        return;
    }

    currentBloqueKey = null;
    showSupervisorView('proceso');
}

function volverABloqueSupervisor() {
    showSupervisorView('bloque');
}

function volverAEtapaSupervisor() {
    showSupervisorView('etapa');
}

function openBloqueSupervisor(bloque) {
    if (!currentProcesoDto) return;

    bloqueStack = [];
    currentBloqueKey = bloque;
    ui.renderBloqueSupervisor(currentProcesoDto, bloque);
    showSupervisorView('bloque');
    bindPanelEventsSupervisor();

    const bloqueView = document.getElementById('supervisorBloqueView');
    if (bloqueView) bloqueView.scrollTop = 0;
}

function openSubBloqueSupervisor(subbloque) {
    if (!currentProcesoDto) return;

    if (currentBloqueKey) {
        bloqueStack.push(currentBloqueKey);
    }

    currentBloqueKey = subbloque;
    ui.renderBloqueSupervisor(currentProcesoDto, subbloque);
    showSupervisorView('bloque');
    bindPanelEventsSupervisor();

    const bloqueView = document.getElementById('supervisorBloqueView');
    if (bloqueView) bloqueView.scrollTop = 0;
}

async function openEtapaSupervisor(etapaKey, etapaNombre) {
    if (!currentProcesoDto) return;

    try {
        currentEtapaKey = etapaKey;
        currentEtapaNombre = etapaNombre;

        const detalleEtapa = await api.fetchDetalleEtapa(currentProcesoDto.idProyecto, etapaKey);

        ui.renderEtapaSupervisor(currentProcesoDto, etapaKey, etapaNombre, detalleEtapa);
        showSupervisorView('etapa');
        bindPanelEventsSupervisor();

        const etapaView = document.getElementById('supervisorEtapaView');
        if (etapaView) etapaView.scrollTop = 0;
    } catch (e) {
        await ui.showCustomAlert('No se pudo cargar la etapa: ' + e.message, 'Error');
    }
}

async function openHistorialSupervisor() {
    if (!currentProcesoDto || !currentEtapaKey) return;

    try {
        const historial = await api.fetchHistorialEtapa(currentProcesoDto.idProyecto, currentEtapaKey);
        ui.renderHistorialSupervisor(historial);
        showSupervisorView('historial');
        bindPanelEventsSupervisor();

        const historialView = document.getElementById('supervisorHistorialView');
        if (historialView) historialView.scrollTop = 0;
    } catch (e) {
        await ui.showCustomAlert('No se pudo cargar el historial: ' + e.message, 'Error');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    currentView = getParam('view') || 'proyectos';
    syncSidebarWithView(currentView);

    bindNavigation();
    bindTabs();
    bindPanelEventsSupervisor();
    bindSearch();
    bindModalActions();
    bindPasswordForm();
    initProfilePhoto();

    await loadAndRender();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.project-more-wrap')) {
        document.querySelectorAll('.project-more-menu.open')
            .forEach(menu => menu.classList.remove('open'));
    }
});

