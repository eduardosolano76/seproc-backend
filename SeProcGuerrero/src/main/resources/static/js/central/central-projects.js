import * as api from './api.js';
import { showCustomAlert } from './ui.js';
import { abrirModalDocumentacionInicial } from '../modalDocumentacion/documentacion-inicial-modal.js';

let currentEstado = 'ACTIVO';
let currentList = [];
let currentProcesoDto = null;
let currentBloqueKey = null;
let bloqueStack = [];
let currentEtapaKey = null;
let currentEtapaNombre = null;

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function isProjectsView() {
    return !!document.getElementById('centralProjectsList');
}

function estadoDotClass(estado) {
    const s = (estado || '').toUpperCase();
    if (s === 'ACTIVO') return 'dot-aprobada';
    if (s === 'INACTIVO') return 'dot-inactivo';
    if (s === 'FINALIZADO') return 'dot-rechazada';
    return 'dot-inactivo';
}

function estadoLabel(estado) {
    const s = (estado || '').toUpperCase();
    if (s === 'ACTIVO') return 'Activo';
    if (s === 'INACTIVO') return 'Inactivo';
    if (s === 'FINALIZADO') return 'Finalizado';
    return 'Inactivo';
}

function normalizarEstadoEtapa(estado) {
    return String(estado || 'BLOQUEADA').trim().toUpperCase();
}

function resolverEstado(dto, clave) {
    return normalizarEstadoEtapa(dto?.estadosEtapa?.[clave]);
}

function claveExiste(dto, clave) {
    return Object.prototype.hasOwnProperty.call(dto?.estadosEtapa || {}, clave);
}

function filtrarClavesExistentes(dto, claves = []) {
    const existentes = (claves || []).filter(clave => claveExiste(dto, clave));
    return existentes.length ? existentes : (claves || []);
}

function resolverEstadoGrupo(dto, claves = []) {
    const clavesFinales = filtrarClavesExistentes(dto, claves);
    const estados = clavesFinales.map(clave => resolverEstado(dto, clave));

    if (!estados.length) return 'BLOQUEADA';

    if (estados.every(estado => estado === 'APROBADA')) {
        return 'APROBADA';
    }

    if (estados.some(estado =>
        estado === 'EN_PROCESO' ||
        estado === 'CON_OBSERVACIONES' ||
        estado === 'DISPONIBLE' ||
        estado === 'APROBADA'
    )) {
        return 'EN_PROCESO';
    }

    return 'BLOQUEADA';
}

function obtenerNumeroNiveles(tipoEdificacion) {
    const tipo = String(tipoEdificacion || '').toUpperCase();
    if (tipo === 'U3C') return 3;
    if (tipo === 'U2C') return 2;
    return 1;
}

function buildEstructuraClaves(dto) {
    const niveles = obtenerNumeroNiveles(dto?.tipoEdificacion);
    const claves = [];

    for (let nivel = 1; nivel <= niveles; nivel++) {
        claves.push(
            `estructura_n${nivel}_habilitado_castillos`,
            `estructura_n${nivel}_habilitado_columnas`,
            `estructura_n${nivel}_habilitado_muros_concreto`,
            `estructura_n${nivel}_habilitado_cadenas_intermedias`,
            `estructura_n${nivel}_cimbra_verticales`,
            `estructura_n${nivel}_concreto_verticales`,
            `estructura_n${nivel}_habilitado_dalas`,
            `estructura_n${nivel}_habilitado_vigas_trabes`,
            `estructura_n${nivel}_cimbra_horizontales`,
            `estructura_n${nivel}_concreto_horizontales`,
            `estructura_n${nivel}_cimbra_losa`,
            `estructura_n${nivel}_habilitado_losa`,
            `estructura_n${nivel}_concreto_losa`,
            `estructura_n${nivel}_habilitado_barandal_concreto`,
            `estructura_n${nivel}_cimbra_otros_concreto`,
            `estructura_n${nivel}_concreto_otros_concreto`
        );
    }

    return filtrarClavesExistentes(dto, claves);
}

function claseVisualDesdeEstado(estado) {
    const e = normalizarEstadoEtapa(estado);
    if (e === 'APROBADA') return 'done';
    if (e === 'EN_PROCESO' || e === 'CON_OBSERVACIONES' || e === 'DISPONIBLE') return 'current';
    return 'locked';
}

function iconoVisualDesdeEstado(estado) {
    const e = normalizarEstadoEtapa(estado);
    if (e === 'APROBADA') return '/assets/iconos/listo.png';
    if (e === 'EN_PROCESO' || e === 'CON_OBSERVACIONES' || e === 'DISPONIBLE') return '/assets/iconos/proceso.png';
    return '/assets/iconos/bloqueado.png';
}

function claseAcordeonDesdeClaves(dto, claves = []) {
    return `status-${claseVisualDesdeEstado(resolverEstadoGrupo(dto, claves))}`;
}

function syncCentralPanelHead(viewName) {
    const panelHead = document.getElementById('centralPanelHead');
    if (!panelHead) return;

    const hide = ['proceso', 'bloque', 'etapa', 'historial'].includes(viewName);
    panelHead.style.display = hide ? 'none' : 'flex';
}

function showCentralView(viewName) {
    const projectsView = document.getElementById('centralProjectsView');
    const procesoView = document.getElementById('centralProcesoView');
    const bloqueView = document.getElementById('centralBloqueView');
    const etapaView = document.getElementById('centralEtapaView');
    const historialView = document.getElementById('centralHistorialView');

    if (projectsView) projectsView.style.display = viewName === 'projects' ? 'block' : 'none';
    if (procesoView) procesoView.style.display = viewName === 'proceso' ? 'block' : 'none';
    if (bloqueView) bloqueView.style.display = viewName === 'bloque' ? 'block' : 'none';
    if (etapaView) etapaView.style.display = viewName === 'etapa' ? 'block' : 'none';
    if (historialView) historialView.style.display = viewName === 'historial' ? 'block' : 'none';

    syncCentralPanelHead(viewName);
}

function syncTabsVisually() {
    document.querySelectorAll('#centralProjectTabs .tab').forEach(tab => tab.classList.remove('active'));
    const tab = document.querySelector(`#centralProjectTabs .tab[data-estado="${currentEstado}"]`);
    if (tab) tab.classList.add('active');
}

async function fetchProjects(estado) {
  return await api.fetchProyectos(estado);
}

async function fetchProjectDetail(id) {
  return await api.fetchDetalleProyecto(id);
}

async function fetchEtapaDetail(idProyecto, etapa) {
  return await api.fetchDetalleEtapaProyecto(idProyecto, etapa);
}

async function fetchEtapaHistorial(idProyecto, etapa) {
  return await api.fetchHistorialEtapaProyecto(idProyecto, etapa);
}

async function changeProjectState(idProyecto, estado) {
  return await api.cambiarEstadoProyecto(idProyecto, estado);
}

function renderCards(items) {
    const list = document.getElementById('centralProjectsList');
    const empty = document.getElementById('centralProjectsEmpty');
    if (!list || !empty) return;

    list.querySelectorAll('.card-sol').forEach(x => x.remove());

    if (!items || items.length === 0) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    for (const it of items) {
        const card = document.createElement('div');
        card.className = 'card-sol';

        const left = document.createElement('div');
        left.className = 'left';

        const school = document.createElement('div');
        school.className = 'school';
        school.textContent = it.nombreEscuela ?? '—';

        const meta = document.createElement('div');
        meta.className = 'meta';

        const dot = document.createElement('span');
        dot.className = `state-dot ${estadoDotClass(it.estadoProyecto)}`;

        const p1 = document.createElement('span');
        p1.textContent = `Constructor: ${it.constructor ?? '—'}`;

        const p2 = document.createElement('span');
        p2.textContent = `Supervisor: ${it.supervisor ?? '—'}`;

        const p3 = document.createElement('span');
        p3.textContent = `Fecha: ${it.fechaAprobacion ?? ''}`;

        meta.appendChild(dot);
        meta.appendChild(p1);
        meta.appendChild(p2);
        meta.appendChild(p3);

        left.appendChild(school);
        left.appendChild(meta);

        const btn = document.createElement('button');
        btn.className = 'btn-detail';
        btn.type = 'button';
        btn.textContent = 'Ver detalle';
        btn.addEventListener('click', () => openDetalleProyecto(it.idProyecto));

        card.appendChild(left);
        card.appendChild(btn);
        list.appendChild(card);
    }
}

function renderProcessStateMenu(dto) {
    const actual = String(dto?.estadoProyecto || 'INACTIVO').toUpperCase();
    const opciones = ['ACTIVO', 'INACTIVO', 'FINALIZADO'].filter(x => x !== actual);

    return `
        <div class="project-status-wrap">
            <button class="project-status-trigger" id="centralProjectStateTrigger" type="button">
                <span class="project-status-dot ${estadoDotClass(actual)}"></span>
                <span class="project-status-text">${escapeHtml(estadoLabel(actual))}</span>
                <span class="project-status-arrow">▾</span>
            </button>

            <div class="project-status-menu" id="centralProjectStateMenu">
                ${opciones.map(op => `
                    <button class="project-status-option" type="button" data-estado="${op}">
                        <span class="project-status-dot ${estadoDotClass(op)}"></span>
                        <span>${escapeHtml(estadoLabel(op))}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderProcessActions(dto) {
    return `
        <div class="process-actions">
            <div class="project-more-wrap">
                <button class="project-more-trigger" type="button" data-more-trigger aria-label="Opciones">
                    ⋮
                </button>

                <div class="project-more-menu">
                    <button
                        class="project-more-option"
                        type="button"
                        data-more-state
                        data-id-proyecto="${dto.idProyecto}">
                        Cambiar estado
                    </button>

                    <button
                        class="project-more-option"
                        type="button"
                        data-more-doc="${dto.idProyecto}">
                        Documentación inicial
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderProcesoCentral(dto) {
    const container = document.getElementById('centralProcesoContent');
    if (!container) return;

    const preliminaresEstado = resolverEstado(dto, 'limpieza_trazo_nivelacion');

    const cimentacionClaves = [
        'excavacion',
        'plantilla_concreto',
        'zapata',
        'contratrabe',
        'columnas_castillos_cimentacion',
        'cimbra_murete_enrase',
        'concreto_cimentacion',
        'habilitado_cadenas_cimentacion',
        'relleno'
    ];

    const estructuraClaves = buildEstructuraClaves(dto);

    const acabadosClaves = ['pisos', 'guarnicion'];

    const cimentacionEstado = resolverEstadoGrupo(dto, cimentacionClaves);
    const estructuraEstado = resolverEstadoGrupo(dto, estructuraClaves);
    const acabadosEstado = resolverEstadoGrupo(dto, acabadosClaves);

    const cardBtn = (label, bloque, estado) => `
        <button
            class="process-mini-stage status-${claseVisualDesdeEstado(estado)}"
            type="button"
            data-bloque="${bloque}"
            data-estado="${claseVisualDesdeEstado(estado)}">
            <span class="process-mini-stage-icon">
                <img src="${iconoVisualDesdeEstado(estado)}" alt="">
            </span>
            <span class="process-mini-stage-label">${escapeHtml(label)}</span>
        </button>
    `;

    container.innerHTML = `
        <div class="process-mini-shell">
            <div class="process-mini-top">
                <button class="process-mini-back" id="btnBackProcesoCentral" type="button" aria-label="Volver">
                    <img src="/assets/iconos/regresar.png" alt="Volver">
                </button>
                <div class="process-mini-chip">PROCESO CONSTRUCTIVO</div>
                <div class="process-mini-spacer"></div>
            </div>

            <div class="process-mini-summary">
                <div class="process-mini-left">
                    <div class="process-mini-school">${escapeHtml(dto.nombreEscuela ?? '')}</div>
                    <div class="process-mini-meta">Tipo de obra: <span>${escapeHtml(dto.tipoObra ?? '')}</span></div>
                    <div class="process-mini-meta">Tipo de edificación: <span>${escapeHtml(dto.tipoEdificacion ?? '')}</span></div>
                    <div class="process-mini-meta">Constructor: <span>${escapeHtml(dto.quienEnvia ?? '—')}</span></div>
                    <div class="process-mini-meta">Supervisor: <span>${escapeHtml(dto.supervisorAsignado ?? '—')}</span></div>
                </div>

                <div class="process-mini-right">
                    <div class="process-mini-summary-top">
                        ${renderProcessActions(dto)}
                    </div>
                    <div class="process-mini-progress-label">Avance en %</div>
                    <div class="process-mini-track">
                        <div class="process-mini-fill" style="width:25%;"></div>
                    </div>
                </div>
            </div>

            <div class="process-mini-list">
                ${cardBtn('Trabajos preliminares', 'preliminares', preliminaresEstado)}
                ${cardBtn('Cimentación', 'cimentacion', cimentacionEstado)}
                ${cardBtn('Estructura', 'estructura', estructuraEstado)}
                ${cardBtn('Albañilería y acabados', 'acabados', acabadosEstado)}
            </div>
        </div>
    `;
}

function renderBloqueCentral(dto, bloque) {
    const container = document.getElementById('centralBloqueContent');
    if (!container) return;

    const stageBtn = (nombre, etapa) => {
        const estadoReal = resolverEstado(dto, etapa);
        const estadoVisual = claseVisualDesdeEstado(estadoReal);

        return `
            <button
                class="process-mini-stage status-${estadoVisual} compact-stage"
                type="button"
                data-etapa="${etapa}"
                data-nombre="${nombre}"
                data-estado="${estadoVisual}">
                <span class="process-mini-stage-icon">
                    <img src="${iconoVisualDesdeEstado(estadoReal)}" alt="">
                </span>
                <span class="process-mini-stage-label">${escapeHtml(nombre)}</span>
            </button>
        `;
    };

    const subBloqueBtn = (nombre, subbloque, clavesHijas = []) => {
        const estadoReal = resolverEstadoGrupo(dto, clavesHijas);
        const estadoVisual = claseVisualDesdeEstado(estadoReal);

        return `
            <button
                class="process-mini-stage status-${estadoVisual} compact-stage"
                type="button"
                data-subbloque="${subbloque}"
                data-estado="${estadoVisual}">
                <span class="process-mini-stage-icon">
                    <img src="${iconoVisualDesdeEstado(estadoReal)}" alt="">
                </span>
                <span class="process-mini-stage-label">${escapeHtml(nombre)}</span>
            </button>
        `;
    };

    const estructuraNivel = (nivel) => {
        const clavesVerticales = [
            `estructura_n${nivel}_habilitado_castillos`,
            `estructura_n${nivel}_habilitado_columnas`,
            `estructura_n${nivel}_habilitado_muros_concreto`,
            `estructura_n${nivel}_habilitado_cadenas_intermedias`,
            `estructura_n${nivel}_cimbra_verticales`,
            `estructura_n${nivel}_concreto_verticales`
        ];

        const clavesHorizontales = [
            `estructura_n${nivel}_habilitado_dalas`,
            `estructura_n${nivel}_habilitado_vigas_trabes`,
            `estructura_n${nivel}_cimbra_horizontales`,
            `estructura_n${nivel}_concreto_horizontales`,
            `estructura_n${nivel}_cimbra_losa`,
            `estructura_n${nivel}_habilitado_losa`,
            `estructura_n${nivel}_concreto_losa`
        ];

        const clavesOtros = [
            `estructura_n${nivel}_habilitado_barandal_concreto`,
            `estructura_n${nivel}_cimbra_otros_concreto`,
            `estructura_n${nivel}_concreto_otros_concreto`
        ];

        const incluirOtros = clavesOtros.some(clave => claveExiste(dto, clave));

        const claseNivel = claseAcordeonDesdeClaves(dto, [
            ...clavesVerticales,
            ...clavesHorizontales,
            ...(incluirOtros ? clavesOtros : [])
        ]);

        const claseVerticales = claseAcordeonDesdeClaves(dto, clavesVerticales);
        const claseHorizontales = claseAcordeonDesdeClaves(dto, clavesHorizontales);
        const claseOtros = claseAcordeonDesdeClaves(dto, clavesOtros);

        return `
            <div class="structure-accordion ${claseNivel}">
                <button class="structure-accordion-toggle ${claseNivel}" type="button">
                    <span class="structure-accordion-title">Estructura nivel ${nivel}</span>
                    <span class="structure-accordion-arrow">
                        <img src="/assets/iconos/abajo.png" alt="">
                    </span>
                </button>

                <div class="structure-accordion-body">
                    <div class="structure-accordion nested ${claseVerticales}">
                        <button class="structure-accordion-toggle ${claseVerticales}" type="button">
                            <span class="structure-accordion-title">Elementos verticales</span>
                            <span class="structure-accordion-arrow">
                                <img src="/assets/iconos/abajo.png" alt="">
                            </span>
                        </button>

                        <div class="structure-accordion-body">
                            ${stageBtn('Habilitado de castillos', `estructura_n${nivel}_habilitado_castillos`)}
                            ${stageBtn('Habilitado de columnas', `estructura_n${nivel}_habilitado_columnas`)}
                            ${subBloqueBtn('Muros', `estructura_n${nivel}_muros`, [
                                `estructura_n${nivel}_habilitado_muros_concreto`,
                                `estructura_n${nivel}_habilitado_cadenas_intermedias`
                            ])}
                            ${stageBtn('Cimbra', `estructura_n${nivel}_cimbra_verticales`)}
                            ${stageBtn('Concreto', `estructura_n${nivel}_concreto_verticales`)}
                        </div>
                    </div>

                    <div class="structure-accordion nested ${claseHorizontales}">
                        <button class="structure-accordion-toggle ${claseHorizontales}" type="button">
                            <span class="structure-accordion-title">Elementos horizontales</span>
                            <span class="structure-accordion-arrow">
                                <img src="/assets/iconos/abajo.png" alt="">
                            </span>
                        </button>

                        <div class="structure-accordion-body">
                            ${stageBtn('Habilitado de dalas', `estructura_n${nivel}_habilitado_dalas`)}
                            ${stageBtn('Habilitado de vigas / trabes', `estructura_n${nivel}_habilitado_vigas_trabes`)}
                            ${stageBtn('Cimbra', `estructura_n${nivel}_cimbra_horizontales`)}
                            ${stageBtn('Concreto', `estructura_n${nivel}_concreto_horizontales`)}
                            ${stageBtn('Cimbra para losa', `estructura_n${nivel}_cimbra_losa`)}
                            ${stageBtn('Habilitado para losa', `estructura_n${nivel}_habilitado_losa`)}
                            ${stageBtn('Concreto', `estructura_n${nivel}_concreto_losa`)}
                        </div>
                    </div>

                    ${incluirOtros ? `
                        <div class="structure-accordion nested ${claseOtros}">
                            <button class="structure-accordion-toggle ${claseOtros}" type="button">
                                <span class="structure-accordion-title">Otros elementos de concreto</span>
                                <span class="structure-accordion-arrow">
                                    <img src="/assets/iconos/abajo.png" alt="">
                                </span>
                            </button>

                            <div class="structure-accordion-body">
                                ${stageBtn('Habilitado de acero para barandal de concreto', `estructura_n${nivel}_habilitado_barandal_concreto`)}
                                ${stageBtn('Cimbra', `estructura_n${nivel}_cimbra_otros_concreto`)}
                                ${stageBtn('Concreto', `estructura_n${nivel}_concreto_otros_concreto`)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    let titulo = 'Bloque';
    let html = '';

    if (bloque === 'preliminares') {
        titulo = 'Trabajos preliminares';
        html = `
            <div class="process-mini-list">
                ${stageBtn('Limpieza, trazo y nivelación', 'limpieza_trazo_nivelacion')}
            </div>
        `;
    } else if (bloque === 'cimentacion') {
        titulo = 'Cimentación';
        html = `
            <div class="process-mini-list">
                ${stageBtn('Excavación', 'excavacion')}
                ${stageBtn('Plantilla de concreto', 'plantilla_concreto')}
                ${subBloqueBtn('Habilitado del acero de refuerzo', 'cimentacion_acero_refuerzo', [
                    'zapata',
                    'contratrabe',
                    'columnas_castillos_cimentacion'
                ])}
                ${stageBtn('Cimbra y murete de enrase', 'cimbra_murete_enrase')}
                ${stageBtn('Concreto', 'concreto_cimentacion')}
                ${stageBtn('Habilitado de cadenas', 'habilitado_cadenas_cimentacion')}
                ${stageBtn('Relleno', 'relleno')}
            </div>
        `;
    } else if (bloque === 'cimentacion_acero_refuerzo') {
        titulo = 'Habilitado del acero de refuerzo';
        html = `
            <div class="process-mini-list">
                ${stageBtn('Zapata', 'zapata')}
                ${stageBtn('Contratrabe', 'contratrabe')}
                ${stageBtn('Columnas o castillos', 'columnas_castillos_cimentacion')}
            </div>
        `;
    } else if (bloque === 'estructura') {
        titulo = 'Estructura';
        const niveles = obtenerNumeroNiveles(dto?.tipoEdificacion);

        html = `
            <div class="structure-list">
                ${estructuraNivel(1)}
                ${niveles >= 2 ? estructuraNivel(2) : ''}
                ${niveles >= 3 ? estructuraNivel(3) : ''}
            </div>
        `;
    } else if (bloque.startsWith('estructura_n') && bloque.endsWith('_muros')) {
        const nivel = bloque.match(/estructura_n(\d+)_muros/)?.[1] || '1';
        titulo = `Muros - nivel ${nivel}`;
        html = `
            <div class="process-mini-list">
                ${stageBtn('Habilitado de muros de concreto', `estructura_n${nivel}_habilitado_muros_concreto`)}
                ${subBloqueBtn('Mampostería', `estructura_n${nivel}_mamposteria`, [
                    `estructura_n${nivel}_habilitado_cadenas_intermedias`
                ])}
            </div>
        `;
    } else if (bloque.startsWith('estructura_n') && bloque.endsWith('_mamposteria')) {
        const nivel = bloque.match(/estructura_n(\d+)_mamposteria/)?.[1] || '1';
        titulo = `Mampostería - nivel ${nivel}`;
        html = `
            <div class="process-mini-list">
                ${stageBtn('Habilitado de cadenas intermedias', `estructura_n${nivel}_habilitado_cadenas_intermedias`)}
            </div>
        `;
    } else if (bloque === 'acabados') {
        titulo = 'Albañilería y acabados';
        html = `
            <div class="process-mini-list">
                ${stageBtn('Pisos', 'pisos')}
                ${stageBtn('Guarnición', 'guarnicion')}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="process-mini-shell">
            <div class="process-mini-top">
                <button class="process-mini-back" id="btnBackBloqueCentral" type="button" aria-label="Volver">
                    <img src="/assets/iconos/regresar.png" alt="Volver">
                </button>
                <div class="process-mini-chip">${escapeHtml(titulo)}</div>
                <div class="process-mini-spacer"></div>
            </div>
            ${html}
        </div>
    `;
}

function getBadgeClass(tipoStr) {
    const s = (tipoStr || '').toLowerCase();
    if (s.includes('aprobacion') || s.includes('aprobado')) return 'badge-aprobacion';
    if (s.includes('observacion')) return 'badge-observacion';
    if (s.includes('borrador')) return 'badge-borrador';
    return 'badge-entrega';
}

function formatearTexto(texto) {
    if (!texto) return '';
    const limpio = texto.replace(/_/g, ' ');
    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

function renderArchivosEvidencia(archivos = []) {
    if (!archivos.length) {
        return `<div class="etapa-empty">Aún no hay evidencias adjuntas.</div>`;
    }

    return `
        <div class="teams-file-list">
            ${archivos.map(arch => `
                <div class="teams-file-item">
                    <div class="t-file-left">
                        <span class="t-file-icon">🖼️</span>
                        <span class="t-file-name">${escapeHtml(arch.nombre || 'Evidencia')}</span>
                        ${arch.nota ? `<span class="t-file-note-text">— ${escapeHtml(arch.nota)}</span>` : ''}
                    </div>
                    <div class="t-file-right">
                        <a href="${escapeHtml(arch.url || '#')}" target="_blank" rel="noopener noreferrer">Ver evidencia</a>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderEtapaCentral(etapaKey, etapaNombre, detalleEtapa) {
    const container = document.getElementById('centralEtapaContent');
    if (!container) return;

    const titulo = etapaNombre || 'Etapa';
    const observacion = detalleEtapa?.ultimaObservacion;
    const entrega = detalleEtapa?.entregaActual;
    const archivos = entrega?.archivos || [];

    container.innerHTML = `
        <div class="etapa-mini-shell">
            <div class="etapa-mini-top">
                <button class="process-mini-back" id="btnBackEtapaCentral" type="button" aria-label="Volver">
                    <img src="/assets/iconos/regresar.png" alt="Volver">
                </button>
                <div class="process-mini-chip">${escapeHtml(titulo.toUpperCase())}</div>
                <button class="etapa-mini-history" id="btnHistoryCentral" type="button" title="Historial">
                    <img src="/assets/iconos/historial.png" alt="Historial">
                </button>
            </div>

            <div class="etapa-mini-grid">
                <div class="etapa-card etapa-card-observaciones">
                    <div class="etapa-card-title">Observaciones del supervisor</div>

                    ${observacion ? `
                        <div class="historial-card-body">
                            <div class="historial-user">${escapeHtml(observacion.usuarioNombre || '—')}</div>
                            <div class="historial-date">${escapeHtml(observacion.fecha || '')}</div>
                            <div class="historial-text">${escapeHtml(observacion.mensaje || '')}</div>
                        </div>
                    ` : `
                        <div class="etapa-empty">Sin observaciones por el momento.</div>
                    `}
                </div>

                <div class="etapa-card etapa-card-entrega">
                    <div class="etapa-card-title">Trabajo del constructor</div>

                    ${entrega ? `
                        <div class="submission-info-card">
                            <div class="sic-header">
                                <h4 class="sic-header-title">Detalles del reporte</h4>
                            </div>

                            <div class="sic-body">
                                <div class="sic-field">
                                    <span class="sic-label">Entregado por</span>
                                    <span class="sic-value">${escapeHtml(entrega.usuarioNombre || '—')}</span>
                                </div>

                                <div class="sic-field">
                                    <span class="sic-label">Fecha de subida</span>
                                    <span class="sic-value">${escapeHtml(entrega.fechaSubida || '—')}</span>
                                </div>

                                <div class="sic-field">
                                    <span class="sic-label">Número de versión</span>
                                    <span class="sic-value">${escapeHtml(entrega.version ?? '')}</span>
                                </div>

                                <div class="sic-field">
                                    <span class="sic-label">Estado de la evaluación</span>
                                    <div class="sic-value">
                                        <span class="entrega-type ${getBadgeClass(entrega.estadoEntrega)}">
                                            ${escapeHtml(formatearTexto(entrega.estadoEntrega))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${renderArchivosEvidencia(archivos)}
                    ` : `
                        <div class="etapa-empty">Aún no hay entrega del constructor para esta etapa.</div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function renderHistorialCentral(historial) {
    const container = document.getElementById('centralHistorialContent');
    if (!container) return;

	const items = Array.isArray(historial)
	  ? historial.filter(item => !String(item?.tipo || '').toLowerCase().includes('borrador'))
	  : [];

	  const getBadgeClass = (tipoStr) => {
	      const s = (tipoStr || '').toLowerCase();
	      if (s.includes('aprobacion') || s.includes('aprobado')) return 'badge-aprobacion';
	      if (s.includes('observacion')) return 'badge-observacion';
	      return 'badge-entrega';
	  };

    const getRoleClass = (rolStr) => {
        const s = (rolStr || '').toLowerCase();
        if (s.includes('supervisor')) return 'role-supervisor';
        if (s.includes('constructor') || s.includes('contratista')) return 'role-constructor';
        if (s.includes('admin')) return 'role-administrador';
        return '';
    };

    container.innerHTML = `
      <div class="process-mini-shell">
        <div class="process-mini-top">
          <button class="process-mini-back" id="btnBackHistorialCentral" type="button" aria-label="Volver">
            <img src="/assets/iconos/regresar.png" alt="Volver">
          </button>
          <div class="process-mini-chip">HISTORIAL</div>
          <div class="process-mini-spacer"></div>
        </div>

        <div class="historial-list">
          ${items.length ? items.map(item => `
            <div class="historial-card ${getBadgeClass(item.tipo)}">
              <div class="historial-card-header">
                <div class="historial-user">
                  ${escapeHtml(item.usuarioNombre || '—')}
                  ${item.usuarioRol ? `<span class="historial-role ${getRoleClass(item.usuarioRol)}">${escapeHtml(item.usuarioRol)}</span>` : ''}
                </div>
                <div class="historial-date">${escapeHtml(item.fecha || '')}</div>
              </div>
              <div class="historial-card-body">
                <div class="historial-type ${getBadgeClass(item.tipo)}">${escapeHtml((item.tipo || '').toLowerCase())}</div>
                <div class="historial-text">${escapeHtml(item.mensaje || item.descripcion || '')}</div>
                ${item.urlArchivo ? `
                  <a class="historial-file" href="${item.urlArchivo}" target="_blank" rel="noopener noreferrer">📄 ${escapeHtml(item.nombreArchivo || 'Ver archivo adjunto')}</a>
                ` : ''}
              </div>
            </div>
          `).join('') : `
            <div class="empty" style="margin-top:20px;">No hay historial registrado todavía.</div>
          `}
        </div>
      </div>
    `;
}


function bindTabs() {
    document.querySelectorAll('#centralProjectTabs .tab').forEach(tab => {
        if (tab.dataset.bound === 'true') return;
        tab.dataset.bound = 'true';

        tab.addEventListener('click', async () => {
            currentEstado = tab.dataset.estado;
            await loadAndRenderProjects();
        });
    });
}

function bindSearch() {
    const searchInput = document.getElementById('searchCentral');
    if (!searchInput || searchInput.dataset.projectsBound === 'true') return;

    searchInput.dataset.projectsBound = 'true';
    searchInput.addEventListener('input', () => {
        if (!isProjectsView()) return;

        const q = (searchInput.value || '').toLowerCase().trim();
        if (!q) {
            renderCards(currentList);
            return;
        }

        const filtered = currentList.filter(x =>
            (x.nombreEscuela ?? '').toLowerCase().includes(q) ||
            (x.constructor ?? '').toLowerCase().includes(q) ||
            (x.supervisor ?? '').toLowerCase().includes(q)
        );

        renderCards(filtered);
    });
}

function cerrarModalCambioEstadoProyecto() {
  document.getElementById('estadoProyectoModalBackdrop')?.remove();
}

function abrirModalCambioEstadoProyecto(idProyecto, estadoActual) {
  cerrarModalCambioEstadoProyecto();

  let estadoSeleccionado = String(estadoActual || 'ACTIVO').toUpperCase();

  const labelEstado = (estado) => {
    const s = String(estado || '').toUpperCase();

    if (s === 'ACTIVO') return 'Activo';
    if (s === 'INACTIVO') return 'Inactivo';
    if (s === 'FINALIZADO') return 'Finalizado';

    return 'Activo';
  };

  const modal = document.createElement('div');
  modal.className = 'estado-proyecto-backdrop';
  modal.id = 'estadoProyectoModalBackdrop';

  modal.innerHTML = `
    <div class="estado-proyecto-modal">
      <button class="estado-proyecto-close" type="button" id="btnCerrarEstadoProyecto">×</button>

      <h3>Cambiar estado</h3>

      <p>Selecciona el nuevo estado del proyecto.</p>

      <div class="estado-select-wrap">
        <button class="estado-select-trigger" type="button" id="estadoSelectTrigger">
          <span id="estadoSelectLabel">${labelEstado(estadoSeleccionado)}</span>
          <span>▾</span>
        </button>

        <div class="estado-select-menu" id="estadoSelectMenu">
          <button type="button" data-estado-option="ACTIVO">Activo</button>
          <button type="button" data-estado-option="INACTIVO">Inactivo</button>
          <button type="button" data-estado-option="FINALIZADO">Finalizado</button>
        </div>
      </div>

      <div class="estado-proyecto-actions">
        <button type="button" class="estado-btn-primary" id="btnGuardarEstadoProyecto">
          Guardar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const trigger = document.getElementById('estadoSelectTrigger');
  const menu = document.getElementById('estadoSelectMenu');
  const label = document.getElementById('estadoSelectLabel');

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    menu?.classList.toggle('open');
  });

  menu?.querySelectorAll('[data-estado-option]').forEach(btn => {
    btn.addEventListener('click', () => {
      estadoSeleccionado = btn.dataset.estadoOption;
      if (label) label.textContent = labelEstado(estadoSeleccionado);
      menu.classList.remove('open');
    });
  });

  document.getElementById('btnCerrarEstadoProyecto')?.addEventListener('click', cerrarModalCambioEstadoProyecto);

  document.getElementById('btnGuardarEstadoProyecto')?.addEventListener('click', async () => {
    try {
      await cambiarEstadoDesdeModal(idProyecto, estadoSeleccionado);

      cerrarModalCambioEstadoProyecto();

      await showCustomAlert('Estado del proyecto actualizado correctamente.', 'Éxito');

      await openDetalleProyecto(idProyecto);
    } catch (e) {
      await showCustomAlert('No se pudo actualizar el estado: ' + e.message, 'Error');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrarModalCambioEstadoProyecto();
    }
  });
}

async function cambiarEstadoDesdeModal(idProyecto, nuevoEstado) {
  await api.cambiarEstadoProyecto(idProyecto, nuevoEstado);
}

function bindPanelEvents() {
    const btnBackProceso = document.getElementById('btnBackProcesoCentral');
    if (btnBackProceso) btnBackProceso.onclick = volverAListaProyectos;

    const btnBackBloque = document.getElementById('btnBackBloqueCentral');
    if (btnBackBloque) btnBackBloque.onclick = volverAProceso;

    const btnBackEtapa = document.getElementById('btnBackEtapaCentral');
    if (btnBackEtapa) btnBackEtapa.onclick = volverABloque;

    const btnBackHistorial = document.getElementById('btnBackHistorialCentral');
    if (btnBackHistorial) btnBackHistorial.onclick = volverAEtapa;

    const btnHistory = document.getElementById('btnHistoryCentral');
    if (btnHistory) btnHistory.onclick = openHistorial;

    const processContent = document.getElementById('centralProcesoContent');
    if (processContent) {
        processContent.querySelectorAll('.process-mini-stage[data-bloque]').forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();
                if (estado === 'locked') return;
                openBloque(btn.dataset.bloque);
            };
        });
    }

    const bloqueContent = document.getElementById('centralBloqueContent');
    if (bloqueContent) {
        bloqueContent.querySelectorAll('.structure-accordion-toggle').forEach(toggle => {
            toggle.onclick = () => {
                const item = toggle.closest('.structure-accordion');
                if (item) item.classList.toggle('open');
            };
        });

        bloqueContent.querySelectorAll('.process-mini-stage[data-subbloque]').forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();
                if (estado === 'locked') return;
                openSubBloque(btn.dataset.subbloque);
            };
        });

        bloqueContent.querySelectorAll('.process-mini-stage[data-etapa]').forEach(btn => {
            btn.onclick = () => {
                const estado = (btn.dataset.estado || '').toLowerCase();
                if (estado === 'locked') return;
                openEtapa(btn.dataset.etapa, btn.dataset.nombre || btn.textContent.trim());
            };
        });
    }

    document.querySelectorAll('[data-more-trigger]').forEach(btn => {
        btn.onclick = (ev) => {
            ev.stopPropagation();

            document.querySelectorAll('.project-more-menu.open').forEach(menu => {
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

            abrirDocumentacionInicial(btn.dataset.moreDoc);
        };
    });

    document.querySelectorAll('[data-more-state]').forEach(btn => {
        btn.onclick = () => {
            const idProyecto = btn.dataset.idProyecto || currentProcesoDto?.idProyecto;
            const estadoActual = currentProcesoDto?.estadoProyecto || 'ACTIVO';

            if (!idProyecto) return;

            document.querySelectorAll('.project-more-menu.open')
                .forEach(menu => menu.classList.remove('open'));

            abrirModalCambioEstadoProyecto(idProyecto, estadoActual);
        };
    });
}

function bindProjectStateDropdown() {
    const trigger = document.getElementById('centralProjectStateTrigger');
    const menu = document.getElementById('centralProjectStateMenu');

    if (!trigger || !menu) return;

    trigger.onclick = (ev) => {
        ev.stopPropagation();
        menu.classList.toggle('open');
    };

    menu.querySelectorAll('.project-status-option').forEach(btn => {
        btn.onclick = async (ev) => {
            ev.stopPropagation();
            menu.classList.remove('open');
            await handleChangeProjectState(btn.dataset.estado);
        };
    });
}

async function abrirDocumentacionInicial(idProyecto) {
  try {
    const data = await api.fetchDocumentacionInicialProyecto(idProyecto);

    abrirModalDocumentacionInicial(data, {
      puedeSubir: false,
      puedeSolicitarCorreccion: true,
      puedeAprobar: true,

      onCorreccion: async (idDocumento, motivo) => {
        try {
          await api.solicitarCorreccionDocumentoInicial(idDocumento, motivo);

          await showCustomAlert(
            'Se solicitó la corrección del documento.',
            'Éxito'
          );

          await abrirDocumentacionInicial(idProyecto);
        } catch (e) {
          await showCustomAlert(
            'No se pudo solicitar la corrección: ' + e.message,
            'Error'
          );

          await abrirDocumentacionInicial(idProyecto);
        }
      },

      onAprobar: async (idDocumento) => {
        try {
          await api.aprobarDocumentoInicial(idDocumento);

          await showCustomAlert(
            'Documento aprobado correctamente.',
            'Éxito'
          );

          await abrirDocumentacionInicial(idProyecto);
        } catch (e) {
          await showCustomAlert(
            'No se pudo aprobar el documento: ' + e.message,
            'Error'
          );

          await abrirDocumentacionInicial(idProyecto);
        }
      }
    });
  } catch (e) {
    await showCustomAlert(
      'No se pudo cargar la documentación inicial: ' + e.message,
      'Error'
    );
  }
}

function bindProjectStateOutsideClickOnce() {
    if (window.__centralStateOutsideBound) return;
    window.__centralStateOutsideBound = true;

	document.addEventListener('click', (ev) => {
	    const wrap = document.querySelector('.project-status-wrap');
	    const menu = document.getElementById('centralProjectStateMenu');

	    if (wrap && menu && !ev.target.closest('.project-status-wrap')) {
	        menu.classList.remove('open');
	    }

	    if (!ev.target.closest('.project-more-wrap')) {
	        document.querySelectorAll('.project-more-menu.open')
	            .forEach(menu => menu.classList.remove('open'));
	    }
	});
}

async function handleChangeProjectState(nuevoEstado) {
    if (!currentProcesoDto?.idProyecto) return;

    const preguntas = {
        ACTIVO: '¿Quieres activar este proyecto?',
        INACTIVO: '¿Quieres inactivar este proyecto?',
        FINALIZADO: '¿Quieres finalizar este proyecto?'
    };

    const confirmado = await showCustomConfirm(
        preguntas[nuevoEstado] || '¿Quieres cambiar el estado del proyecto?',
        'Confirmar cambio de estado'
    );

    if (!confirmado) return;

    try {
        await changeProjectState(currentProcesoDto.idProyecto, nuevoEstado);
        currentEstado = nuevoEstado;
        await showCustomAlert('El estado del proyecto se actualizó correctamente.', 'Éxito');
        volverAListaProyectos();
        await loadAndRenderProjects();
    } catch (e) {
        await showCustomAlert(e.message || 'No se pudo cambiar el estado.', 'Error');
    }
}

async function loadAndRenderProjects() {
    if (!isProjectsView()) return;

    try {
        showCentralView('projects');
        syncTabsVisually();

        const searchInput = document.getElementById('searchCentral');
        if (searchInput) searchInput.value = '';

        currentList = await fetchProjects(currentEstado);
        renderCards(currentList);
    } catch (e) {
        await showCustomAlert(`No se pudieron cargar los proyectos: ${e.message}`, 'Error');
    }
}

async function openDetalleProyecto(idProyecto) {
    try {
        currentProcesoDto = await fetchProjectDetail(idProyecto);
        currentBloqueKey = null;
        bloqueStack = [];

        renderProcesoCentral(currentProcesoDto);
        showCentralView('proceso');
        bindPanelEvents();

        const procesoView = document.getElementById('centralProcesoView');
        if (procesoView) procesoView.scrollTop = 0;
    } catch (e) {
        await showCustomAlert(`No se pudo cargar el detalle: ${e.message}`, 'Error');
    }
}

function openBloque(bloque) {
    if (!currentProcesoDto) return;

    bloqueStack = [];
    currentBloqueKey = bloque;
    renderBloqueCentral(currentProcesoDto, bloque);
    showCentralView('bloque');
    bindPanelEvents();

    const bloqueView = document.getElementById('centralBloqueView');
    if (bloqueView) bloqueView.scrollTop = 0;
}

function openSubBloque(subbloque) {
    if (!currentProcesoDto) return;

    if (currentBloqueKey) {
        bloqueStack.push(currentBloqueKey);
    }

    currentBloqueKey = subbloque;
    renderBloqueCentral(currentProcesoDto, subbloque);
    showCentralView('bloque');
    bindPanelEvents();

    const bloqueView = document.getElementById('centralBloqueView');
    if (bloqueView) bloqueView.scrollTop = 0;
}

async function openEtapa(etapaKey, etapaNombre) {
    if (!currentProcesoDto) return;

    try {
        currentEtapaKey = etapaKey;
        currentEtapaNombre = etapaNombre;

        const detalleEtapa = await fetchEtapaDetail(currentProcesoDto.idProyecto, etapaKey);
        renderEtapaCentral(etapaKey, etapaNombre, detalleEtapa);
        showCentralView('etapa');
        bindPanelEvents();

        const etapaView = document.getElementById('centralEtapaView');
        if (etapaView) etapaView.scrollTop = 0;
    } catch (e) {
        await showCustomAlert(`No se pudo cargar la etapa: ${e.message}`, 'Error');
    }
}

async function openHistorial() {
    if (!currentProcesoDto || !currentEtapaKey) return;

    try {
        const historial = await fetchEtapaHistorial(currentProcesoDto.idProyecto, currentEtapaKey);
        renderHistorialCentral(historial);
        showCentralView('historial');
        bindPanelEvents();

        const historialView = document.getElementById('centralHistorialView');
        if (historialView) historialView.scrollTop = 0;
    } catch (e) {
        await showCustomAlert(`No se pudo cargar el historial: ${e.message}`, 'Error');
    }
}

function volverAListaProyectos() {
    bloqueStack = [];
    currentBloqueKey = null;
    currentEtapaKey = null;
    currentEtapaNombre = null;
    currentProcesoDto = null;
    showCentralView('projects');
}

function volverAProceso() {
    if (!currentProcesoDto) {
        showCentralView('proceso');
        return;
    }

    if (bloqueStack.length > 0) {
        currentBloqueKey = bloqueStack.pop();
        renderBloqueCentral(currentProcesoDto, currentBloqueKey);
        showCentralView('bloque');
        bindPanelEvents();

        const bloqueView = document.getElementById('centralBloqueView');
        if (bloqueView) bloqueView.scrollTop = 0;
        return;
    }

    currentBloqueKey = null;
    renderProcesoCentral(currentProcesoDto);
    showCentralView('proceso');
    bindPanelEvents();
}

function volverABloque() {
    showCentralView('bloque');
}

function volverAEtapa() {
    showCentralView('etapa');
}

function initProjectsModule() {
    if (!isProjectsView()) return;

    bindTabs();
    bindSearch();
    bindPanelEvents();
    bindProjectStateOutsideClickOnce();
    loadAndRenderProjects();
}

document.addEventListener('DOMContentLoaded', initProjectsModule);

window.addEventListener('panelLoaded', (e) => {
    if (e.detail?.view === 'proyectos') {
        initProjectsModule();
    }
});