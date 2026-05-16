// app.js
import * as api from './api.js';
import * as ui from './ui.js';
import * as nav from './navigation.js';
import { abrirModalDocumentacionInicial } from '../modalDocumentacion/documentacion-inicial-modal.js';

let currentEstado = 'ACTIVO';
let currentList = [];
let currentProcesoDto = null;
let currentBloqueKey = null;
let bloqueStack = [];
let currentEtapaKey = null;
let currentEtapaNombre = null;

// Elementos Globales (fuera del panel)
const profileBtn = document.getElementById('profileBtn');
const profileFile = document.getElementById('profileFile');
const searchConstructor = document.getElementById('searchConstructor');
const projModal = document.getElementById('projModal');
const projModalBackdrop = document.getElementById('projModalBackdrop');
const detalleModal = document.getElementById('detalleModal');
const detalleBackdrop = document.getElementById('detalleBackdrop');

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    const view = nav.getViewFromUrl();
    ui.syncSidebarWithUrl(view);

    registerGlobalEvents();
    bindPanelEvents();
    initProfilePhoto();

    if (view !== 'password') {
        loadAndRenderProjects();
    } else {
        showConstructorView('password');
    }
});

// --- Navegación del Menú ---
document.getElementById('navProyectos')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    nav.loadPanelFromUrl('/constructor', true);
});

document.getElementById('navPassword')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    nav.loadPanelFromUrl('/constructor?view=password', true);
});

window.addEventListener('popstate', (e) => {
    const href = (e.state && e.state.href) ? e.state.href : window.location.href;
    nav.loadPanelFromUrl(href, false);
});

window.addEventListener('panelLoaded', () => {
    bindPanelEvents();
    const view = nav.getViewFromUrl();
    if (view !== 'password') {
        loadAndRenderProjects();
    } else {
        showConstructorView('password');
    }
});

function bindPanelEvents() {
    const btnAdd = document.getElementById('btnAddProyecto');
    if (btnAdd) {
        btnAdd.onclick = openProjModal;
    }

    const tabs = document.querySelectorAll('#tabsConstructor .tab');
    tabs.forEach(tab => {
        tab.onclick = async () => {
            document.querySelectorAll('#tabsConstructor .tab').forEach(x => x.classList.remove('active'));
            tab.classList.add('active');
            currentEstado = tab.dataset.estado;
            await loadAndRenderProjects();
        };
    });

    const btnBackProceso = document.getElementById('btnBackProceso');
    if (btnBackProceso) btnBackProceso.onclick = volverAListaProyectos;

    const btnBackBloque = document.getElementById('btnBackBloque');
    if (btnBackBloque) btnBackBloque.onclick = volverAProcesoConstructor;

    const btnBackEtapa = document.getElementById('btnBackEtapa');
    if (btnBackEtapa) btnBackEtapa.onclick = volverABloqueConstructor;

    const processContent = document.getElementById('constructorProcesoContent');
    if (processContent) {
        const bloques = processContent.querySelectorAll('.process-mini-stage[data-bloque]');
        bloques.forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();

                if (estado === 'locked') return;

                openBloqueConstructor(btn.dataset.bloque);
            };
        });
    }

    const bloqueContent = document.getElementById('constructorBloqueContent');
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

                openSubBloqueConstructor(btn.dataset.subbloque);
            };
        });

        const etapas = bloqueContent.querySelectorAll('.process-mini-stage[data-etapa]');
        etapas.forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();

                // solo las etapas finales bloqueadas no abren la pestaña de evidencias
                if (estado === 'locked') return;

                openEtapaConstructor(
                    btn.dataset.etapa,
                    btn.dataset.nombre || btn.textContent.trim()
                );
            };
        });
    }

    const btnHistoryEtapa = document.getElementById('btnHistoryEtapa');
    if (btnHistoryEtapa) {
        btnHistoryEtapa.onclick = openHistorialConstructor;
    }

    const btnBackHistorial = document.getElementById('btnBackHistorial');
    if (btnBackHistorial) {
        btnBackHistorial.onclick = volverAEtapaConstructor;
    }
	
	document.querySelectorAll('[data-doc-inicial]').forEach(btn => {
	    btn.addEventListener('click', () => {
	        abrirDocumentacionInicial(btn.dataset.docInicial);
	    });
	});

	document.querySelectorAll('[data-more-trigger]').forEach(btn => {
	    btn.addEventListener('click', (ev) => {
	        ev.stopPropagation();
	        const menu = btn.parentElement?.querySelector('.project-more-menu');
	        menu?.classList.toggle('open');
	    });
	});

	document.querySelectorAll('[data-more-doc]').forEach(btn => {
	    btn.addEventListener('click', () => {
	        abrirDocumentacionInicial(btn.dataset.moreDoc);
	    });
	});
}

function registerGlobalEvents() {
    nav.initGlobalEscape({ detalleModal, detalleBackdrop, projModal, projModalBackdrop });

    document.getElementById('btnCerrarProyecto')?.addEventListener('click', closeProjModal);
    projModalBackdrop?.addEventListener('click', closeProjModal);
    document.getElementById('btnCerrarDetalle')?.addEventListener('click', () => ui.closeModal(detalleModal, detalleBackdrop));
    detalleBackdrop?.addEventListener('click', () => ui.closeModal(detalleModal, detalleBackdrop));

    const selEstado = document.querySelector('#formSolicitudProyecto select[name="estado"]');
    const selMunicipio = document.querySelector('#formSolicitudProyecto select[name="municipio"]');
    selEstado?.addEventListener('change', () => loadMunicipios().catch(console.error));
    selMunicipio?.addEventListener('change', () => loadLocalidades().catch(console.error));

    searchConstructor?.addEventListener('input', () => {
        const q = (searchConstructor.value || '').toLowerCase().trim();
        if (!q) return ui.renderCards(currentList, openDetalleProyecto);

        const filtered = currentList.filter(x =>
            (x.nombreEscuela ?? '').toLowerCase().includes(q) ||
            (x.supervisor ?? '').toLowerCase().includes(q)
        );
        ui.renderCards(filtered, openDetalleProyecto);
    });

    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'formCambiarPasswordConstructor') {
            e.preventDefault();
            await handlePasswordChange();
        }
    });

    document.getElementById('btnEnviarSolicitud')?.addEventListener('click', async () => {
        const form = document.getElementById('formSolicitudProyecto');
        if (!form) return;
        if (!form.checkValidity()) return form.reportValidity();
        await handleProjectSubmit(form);
    });
}

function showConstructorView(viewName) {
    const projectsView = document.getElementById('constructorProjectsView');
    const passwordView = document.getElementById('constructorPasswordView');
    const procesoView = document.getElementById('constructorProcesoView');
    const bloqueView = document.getElementById('constructorBloqueView');
    const etapaView = document.getElementById('constructorEtapaView');
    const historialView = document.getElementById('constructorHistorialView');

    if (projectsView) projectsView.style.display = viewName === 'projects' ? 'block' : 'none';
    if (passwordView) passwordView.style.display = viewName === 'password' ? 'block' : 'none';
    if (procesoView) procesoView.style.display = viewName === 'proceso' ? 'block' : 'none';
    if (bloqueView) bloqueView.style.display = viewName === 'bloque' ? 'block' : 'none';
    if (etapaView) etapaView.style.display = viewName === 'etapa' ? 'block' : 'none';
    if (historialView) historialView.style.display = viewName === 'historial' ? 'block' : 'none';
}

function volverAListaProyectos() {
    bloqueStack = [];
    currentBloqueKey = null;
    currentProcesoDto = null;
    showConstructorView('projects');
    loadAndRenderProjects();
}

function volverAProcesoConstructor() {
    if (!currentProcesoDto) {
        showConstructorView('proceso');
        return;
    }

    if (bloqueStack.length > 0) {
        currentBloqueKey = bloqueStack.pop();
        ui.renderBloqueProyecto(currentProcesoDto, currentBloqueKey);
        showConstructorView('bloque');
        bindPanelEvents();

        const bloqueView = document.getElementById('constructorBloqueView');
        if (bloqueView) bloqueView.scrollTop = 0;
        return;
    }

    currentBloqueKey = null;
    showConstructorView('proceso');
}

function openBloqueConstructor(bloque) {
    if (!currentProcesoDto) return;

    bloqueStack = [];
    currentBloqueKey = bloque;
    ui.renderBloqueProyecto(currentProcesoDto, bloque);
    showConstructorView('bloque');
    bindPanelEvents();

    const bloqueView = document.getElementById('constructorBloqueView');
    if (bloqueView) bloqueView.scrollTop = 0;
}

function openSubBloqueConstructor(subbloque) {
    if (!currentProcesoDto) return;

    if (currentBloqueKey) {
        bloqueStack.push(currentBloqueKey);
    }

    currentBloqueKey = subbloque;
    ui.renderBloqueProyecto(currentProcesoDto, subbloque);
    showConstructorView('bloque');
    bindPanelEvents();

    const bloqueView = document.getElementById('constructorBloqueView');
    if (bloqueView) bloqueView.scrollTop = 0;
}

function volverABloqueConstructor() {
    showConstructorView('bloque');
}

async function openEtapaConstructor(etapaKey, etapaNombre) {
    if (!currentProcesoDto) return;

    try {
        currentEtapaKey = etapaKey;
        currentEtapaNombre = etapaNombre;

        const detalleEtapa = await api.fetchDetalleEtapa(currentProcesoDto.idProyecto, etapaKey);

        ui.renderEtapaProyecto(currentProcesoDto, etapaKey, etapaNombre, detalleEtapa);
        showConstructorView('etapa');
        bindPanelEvents();

        const etapaView = document.getElementById('constructorEtapaView');
        if (etapaView) etapaView.scrollTop = 0;

        const btnUpload = document.getElementById(`btnUploadReporte_${etapaKey}`);
        const fileInput = document.getElementById(`reporteFile_${etapaKey}`);
        const btnSend = document.getElementById(`btnSendReporte_${etapaKey}`);

        // LÓGICA DE SUBIDA (BORRADOR)
        if (btnUpload && fileInput) {
            btnUpload.onclick = () => fileInput.click();

            fileInput.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    return ui.showCustomAlert('Por favor selecciona una imagen (JPG, PNG, WEBP).', 'Error de formato');
                }

                try {
                    btnUpload.innerHTML = 'Subiendo...';
                    btnUpload.disabled = true;

                    await api.uploadReportPdf(currentProcesoDto.idProyecto, etapaKey, file); // Usa la misma función de api
                    await openEtapaConstructor(etapaKey, etapaNombre); // Recarga para ver la lista actualizada

                } catch (err) {
                    await ui.showCustomAlert(err.message, 'Error al subir');
                } finally {
                    btnUpload.disabled = false;
                    fileInput.value = '';
                }
            };
        }

        // LÓGICA DE ELIMINAR IMAGEN
        const btnsQuitar = document.querySelectorAll('.btn-quitar-imagen');
        btnsQuitar.forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation(); // Evita que se cierre el dropdown antes del click
                const path = btn.dataset.path;
                const confirmado = await ui.showCustomConfirm("¿Estás seguro de quitar esta imagen?");
                if (!confirmado) return;

                try {
                    await api.deleteReportImage(currentProcesoDto.idProyecto, etapaKey, path);
                    await openEtapaConstructor(etapaKey, etapaNombre); // Recargar la vista
                } catch (err) {
                    ui.showCustomAlert(err.message, 'Error al eliminar');
                }
            };
        });

        // LÓGICA DEL MENÚ DE 3 PUNTOS
        const btnDots = document.querySelectorAll('.t-btn-dots');
        btnDots.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();

                const miMenu = btn.nextElementSibling;
                const estabaAbierto = miMenu.classList.contains('show');

                // Cerrar todos los demás menús primero
                document.querySelectorAll('.t-dropdown-menu').forEach(m => m.classList.remove('show'));

                // Si mi menú NO estaba abierto, lo abro. Si estaba abierto, ya se cerró arriba.
                if (!estabaAbierto) {
                    miMenu.classList.add('show');
                }

            };
        });

        // LÓGICA DE GUARDADO AUTOMÁTICO DE NOTAS (AUTO-SAVE)
        const noteInputs = document.querySelectorAll('.t-file-note-input');
        noteInputs.forEach(input => {
            let lastValue = input.value; // Guardamos el valor inicial

            // Cuando el usuario sale del input (pierde el foco)
            input.onblur = async () => {
                const newValue = input.value.trim();

                // Solo guardamos si el texto realmente cambió
                if (newValue !== lastValue) {
                    const originalColor = input.style.color;
                    try {
                        input.style.color = '#3b82f6'; // Feedback visual sutil (azul)
                        const path = input.dataset.path;

                        await api.updateReportNote(currentProcesoDto.idProyecto, etapaKey, path, newValue);
                        lastValue = newValue; // Actualizamos la referencia
                        input.style.color = '#22c55e'; // Verde de éxito brevemente

                        setTimeout(() => input.style.color = originalColor, 1000);
                    } catch (err) {
                        ui.showCustomAlert(err.message, 'Error al guardar nota');
                        input.value = lastValue; // Revertimos al valor anterior si falla
                        input.style.color = originalColor;
                    }
                }
            };

            // Permitir guardar al presionar la tecla "Enter"
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    input.blur(); // Quita el foco y activa el onblur de arriba
                }
            };
        });

        // Cerrar menús al hacer click en cualquier otra parte
        document.addEventListener('click', () => {
            document.querySelectorAll('.t-dropdown-menu').forEach(m => m.classList.remove('show'));
        });

        // LÓGICA DE ENVÍO AL SUPERVISOR (ENTREGAR)
        if (btnSend) {
            btnSend.onclick = async () => {
                const confirmado = await ui.showCustomConfirm(
                    "¿Estás seguro de entregar este reporte? Una vez enviado, el supervisor podrá evaluarlo.",
                    "Confirmar entrega"
                );

                if (!confirmado) return;

                try {
                    btnSend.textContent = 'Entregando...';
                    btnSend.disabled = true;
                    if (btnUpload) btnUpload.disabled = true;

                    await api.entregarReportePdf(currentProcesoDto.idProyecto, etapaKey);
                    await ui.showCustomAlert('El reporte ha sido enviado al supervisor exitosamente.', '¡Entregado!');

                    // Recargar la vista de la etapa
                    await openEtapaConstructor(etapaKey, etapaNombre);
                } catch (err) {
                    await ui.showCustomAlert(err.message, 'Error al entregar');
                    btnSend.textContent = 'Entregar';
                    btnSend.disabled = false;
                    if (btnUpload) btnUpload.disabled = false;
                }
            };
        }

        // --- DESCARGAR PDF (Solo aparece si está APROBADA) ---
        const btnDescargarPdf = document.getElementById(`btnDescargarPdf_${etapaKey}`);
        if (btnDescargarPdf) {
            btnDescargarPdf.onclick = async () => {
                try {
                    btnDescargarPdf.innerHTML = 'Generando...';
                    btnDescargarPdf.disabled = true;

                    await api.downloadReportPdf(currentProcesoDto.idProyecto, etapaKey);

                } catch (err) {
                    ui.showCustomAlert('Error al generar PDF: ' + err.message, 'Error');
                } finally {
                    btnDescargarPdf.innerHTML = 'Descargar en PDF';
                    btnDescargarPdf.disabled = false;
                }
            };
        }

    } catch (e) {
        await ui.showCustomAlert('No se pudo cargar la etapa: ' + e.message, 'Error');
    }
}

async function loadAndRenderProjects() {
    try {
        showConstructorView('projects');

        document.querySelectorAll('#tabsConstructor .tab').forEach(t => t.classList.remove('active'));

        const targetTab = document.querySelector(`#tabsConstructor .tab[data-estado="${currentEstado}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        } else {
            currentEstado = 'ACTIVO';
            const defaultTab = document.querySelector('#tabsConstructor .tab[data-estado="ACTIVO"]');
            if (defaultTab) defaultTab.classList.add('active');
        }

        if (searchConstructor) searchConstructor.value = '';

        currentList = await api.fetchProyectos(currentEstado);
        ui.renderCards(currentList, openDetalleProyecto);
    } catch (e) {
        await ui.showCustomAlert('No se pudieron cargar los proyectos: ' + e.message, 'Error');
    }
}

async function openDetalleProyecto(idProyecto) {
    try {
        const dto = await api.fetchDetalleProyecto(idProyecto);
        currentProcesoDto = dto;
        bloqueStack = [];
        currentBloqueKey = null;

        ui.renderProcesoProyecto(dto);
        showConstructorView('proceso');
        bindPanelEvents();

        const procesoView = document.getElementById('constructorProcesoView');
        if (procesoView) procesoView.scrollTop = 0;
    } catch (e) {
        await ui.showCustomAlert('No se pudo cargar el detalle: ' + e.message, 'Error');
    }
}

async function openProjModal() {
    ui.openModal(projModal, projModalBackdrop);
    await loadEstados();
    await loadTiposEdificacion();
}

function closeProjModal() {
    ui.closeModal(projModal, projModalBackdrop);
}

async function handleProjectSubmit(form) {
    const payload = {
        nombreEscuela: form.nombreEscuela.value.trim(),
        cct1: form.cct1.value.trim(),
        cct2: form.cct2.value.trim(),
        idEstado: parseInt(form.estado.value, 10),
        idMunicipio: parseInt(form.municipio.value, 10),
        idLocalidad: parseInt(form.ciudad.value, 10),
        calleNumero: form.calleNumero.value.trim(),
        cp: form.cp.value.trim(),
        responsable: form.responsable.value.trim(),
        contacto: form.contacto.value.trim(),
        numInmuebles: parseInt(form.numInmuebles.value, 10),
        numEntreEjes: parseInt(form.numEntreEjes.value, 10),
        idTipoEdificacion: parseInt(form.tipoEdificacion.value, 10),
        tipoObra: form.tipoObra.value
    };

	try {
	    const result = await api.postSolicitud(payload);
	    const idSolicitud = result.idSolicitud;

	    const documentos = [
	        {
	            tipo: 'LICENCIA_CONSTRUCCION',
	            input: form.querySelector('input[name="licenciaConstruccion"]')
	        },
	        {
	            tipo: 'MECANICA_SUELOS',
	            input: form.querySelector('input[name="mecanicaSuelos"]')
	        },
	        {
	            tipo: 'ESTUDIO_AMBIENTAL',
	            input: form.querySelector('input[name="estudioAmbiental"]')
	        }
	    ];

	    for (const doc of documentos) {
	        const file = doc.input?.files?.[0];

	        if (file) {
	            await api.uploadDocumentoInicialSolicitud(idSolicitud, doc.tipo, file);
	        }
	    }

	    closeProjModal();
	    form.reset();

	    await ui.showCustomAlert(
	        'Solicitud enviada correctamente. Si faltan documentos, podrás subirlos después desde Documentación inicial.',
	        'Éxito'
	    );

	    loadAndRenderProjects();
	} catch (e) {
	    await ui.showCustomAlert('No se pudo enviar: ' + e.message, 'Error');
	}
}

async function loadEstados() {
    const selEstado = document.querySelector('#formSolicitudProyecto select[name="estado"]');
    const selMunicipio = document.querySelector('#formSolicitudProyecto select[name="municipio"]');
    const selCiudad = document.querySelector('#formSolicitudProyecto select[name="ciudad"]');

    const data = await api.fetchEstados();
    ui.fillSelect(selEstado, data);
    selMunicipio.innerHTML = `<option value="" disabled selected>Seleccionar</option>`;
    selCiudad.innerHTML = `<option value="" disabled selected>Seleccionar</option>`;
}

async function loadMunicipios() {
    const selEstado = document.querySelector('#formSolicitudProyecto select[name="estado"]');
    const selMunicipio = document.querySelector('#formSolicitudProyecto select[name="municipio"]');
    const selCiudad = document.querySelector('#formSolicitudProyecto select[name="ciudad"]');

    if (!selEstado.value) return;
    const data = await api.fetchMunicipios(selEstado.value);
    ui.fillSelect(selMunicipio, data);
    selCiudad.innerHTML = `<option value="" disabled selected>Seleccionar</option>`;
}

async function loadLocalidades() {
    const selMunicipio = document.querySelector('#formSolicitudProyecto select[name="municipio"]');
    const selCiudad = document.querySelector('#formSolicitudProyecto select[name="ciudad"]');

    if (!selMunicipio.value) return;
    const data = await api.fetchLocalidades(selMunicipio.value);
    ui.fillSelect(selCiudad, data);
}

async function handlePasswordChange() {
    const form = document.getElementById('formCambiarPasswordConstructor');

    const passActual = document.getElementById('passActualConstructor').value.trim();
    const passNueva = document.getElementById('passNuevaConstructor').value.trim();
    const passRepetida = document.getElementById('passRepetidaConstructor').value.trim();

    if (!passActual || !passNueva || !passRepetida) {
        return ui.showCustomAlert('Todos los campos son obligatorios.', 'Error');
    }

    if (passNueva !== passRepetida) {
        return ui.showCustomAlert('Las contraseñas nuevas no coinciden.', 'Error');
    }

    const payload = {
        passActual,
        passNueva,
        passRepetida
    };

    try {
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

        const headers = {
            'Content-Type': 'application/json'
        };

        if (csrfToken && csrfHeader) {
            headers[csrfHeader] = csrfToken;
        }

        const response = await fetch('/constructor/perfil/password', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Ocurrió un error al cambiar la contraseña.');
        }

        await ui.showCustomAlert('Tu contraseña ha sido actualizada correctamente.', 'Éxito');
        form.reset();
    } catch (error) {
        await ui.showCustomAlert(error.message, 'Error');
    }
}

async function loadTiposEdificacion() {
    const selTipoEdificacion = document.querySelector('#formSolicitudProyecto select[name="tipoEdificacion"]');
    if (!selTipoEdificacion) return;

    const data = await api.fetchTiposEdificacion();
    ui.fillSelect(selTipoEdificacion, data);
}

function initProfilePhoto() {
    const btnViewPhoto = document.getElementById('btnViewPhoto');
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const btnDeletePhoto = document.getElementById('btnDeletePhoto');

    const fotoUrl = profileBtn?.dataset?.foto;
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
        const file = e.target.files?.[0];
        if (!file) return;

        document.getElementById('profileImg').src = URL.createObjectURL(file);
        document.getElementById('profileImg').style.display = 'block';
        document.getElementById('profileFallback').style.display = 'none';

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

function volverAEtapaConstructor() {
    showConstructorView('etapa');
}

async function openHistorialConstructor() {
    if (!currentProcesoDto || !currentEtapaKey) return;

    try {
        const historial = await api.fetchHistorialEtapa(currentProcesoDto.idProyecto, currentEtapaKey);
        ui.renderHistorialProyecto(historial);
        showConstructorView('historial');
        bindPanelEvents();

        const historialView = document.getElementById('constructorHistorialView');
        if (historialView) historialView.scrollTop = 0;
    } catch (e) {
        await ui.showCustomAlert('No se pudo cargar el historial: ' + e.message, 'Error');
    }
}

async function abrirDocumentacionInicial(idProyecto) {
    try {
        const data = await api.fetchDocumentacionInicialProyecto(idProyecto);

        abrirModalDocumentacionInicial(data, {
            puedeSubir: true,

            onUpload: async (tipoDocumento, file) => {
                try {
                    if (!data.idSolicitud) {
                        throw new Error('No se encontró la solicitud relacionada al proyecto.');
                    }

                    await api.uploadDocumentoInicialSolicitud(
                        data.idSolicitud,
                        tipoDocumento,
                        file
                    );

                    await ui.showCustomAlert(
                        'Documento subido correctamente.',
                        'Éxito'
                    );

                    await abrirDocumentacionInicial(idProyecto);
                } catch (e) {
                    await ui.showCustomAlert(
                        'No se pudo subir el documento: ' + e.message,
                        'Error'
                    );

                    await abrirDocumentacionInicial(idProyecto);
                }
            }
        });
    } catch (e) {
        await ui.showCustomAlert(
            'No se pudo cargar la documentación inicial: ' + e.message,
            'Error'
        );
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.project-more-wrap')) {
        document.querySelectorAll('.project-more-menu.open')
            .forEach(menu => menu.classList.remove('open'));
    }
});

function bindDocumentoInicialFileNames() {
  document.querySelectorAll('.doc-upload-input').forEach(input => {
    if (input.dataset.fileBound === 'true') return;
    input.dataset.fileBound = 'true';

    input.addEventListener('change', () => {
      const nameBox = input.closest('.doc-upload-card')?.querySelector('.doc-upload-name');
      const fileName = input.files?.[0]?.name || 'No se ha seleccionado ningún archivo';

      if (nameBox) {
        nameBox.textContent = fileName;
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', bindDocumentoInicialFileNames);
window.addEventListener('panelLoaded', bindDocumentoInicialFileNames);