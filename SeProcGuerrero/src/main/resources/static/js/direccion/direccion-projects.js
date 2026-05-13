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
  return !!document.getElementById('direccionProjectsList');
}

function estadoDotClass(estado) {
  const s = (estado || '').toUpperCase();
  if (s === 'ACTIVO') return 'dot-aprobada';
  if (s === 'INACTIVO') return 'dot-inactivo';
  if (s === 'FINALIZADO') return 'dot-rechazada';
  return 'dot-inactivo';
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
  if (estados.every(estado => estado === 'APROBADA')) return 'APROBADA';

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

function syncPanelHead(viewName) {
  const panelHead = document.getElementById('direccionPanelHead');
  if (!panelHead) return;
  const hide = ['proceso', 'bloque', 'etapa', 'historial'].includes(viewName);
  panelHead.style.display = hide ? 'none' : 'flex';
}

function showDireccionView(viewName) {
  const projectsView = document.getElementById('direccionProjectsView');
  const procesoView = document.getElementById('direccionProcesoView');
  const bloqueView = document.getElementById('direccionBloqueView');
  const etapaView = document.getElementById('direccionEtapaView');
  const historialView = document.getElementById('direccionHistorialView');

  if (projectsView) projectsView.style.display = viewName === 'projects' ? 'block' : 'none';
  if (procesoView) procesoView.style.display = viewName === 'proceso' ? 'block' : 'none';
  if (bloqueView) bloqueView.style.display = viewName === 'bloque' ? 'block' : 'none';
  if (etapaView) etapaView.style.display = viewName === 'etapa' ? 'block' : 'none';
  if (historialView) historialView.style.display = viewName === 'historial' ? 'block' : 'none';

  syncPanelHead(viewName);
}

function syncTabsVisually() {
  document.querySelectorAll('#direccionProjectTabs .tab').forEach(tab => tab.classList.remove('active'));
  const tab = document.querySelector(`#direccionProjectTabs .tab[data-estado="${currentEstado}"]`);
  if (tab) tab.classList.add('active');
}

function renderCards(items) {
  const list = document.getElementById('direccionProjectsList');
  const empty = document.getElementById('direccionProjectsEmpty');
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

function renderProcessActionsDireccion(dto) {
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
            data-more-doc="${dto.idProyecto}">
            Documentación inicial
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderProcesoDireccion(dto) {
  const container = document.getElementById('direccionProcesoContent');
  if (!container) return;

  const preliminaresEstado = resolverEstado(dto, 'limpieza_trazo_nivelacion');
  const cimentacionClaves = ['excavacion','plantilla_concreto','zapata','contratrabe','columnas_castillos_cimentacion','cimbra_murete_enrase','concreto_cimentacion','habilitado_cadenas_cimentacion','relleno'];
  const estructuraClaves = buildEstructuraClaves(dto);
  const acabadosClaves = ['pisos', 'guarnicion'];

  const cimentacionEstado = resolverEstadoGrupo(dto, cimentacionClaves);
  const estructuraEstado = resolverEstadoGrupo(dto, estructuraClaves);
  const acabadosEstado = resolverEstadoGrupo(dto, acabadosClaves);

  const cardBtn = (label, bloque, estado) => `
    <button class="process-mini-stage status-${claseVisualDesdeEstado(estado)}" type="button" data-bloque="${bloque}" data-estado="${claseVisualDesdeEstado(estado)}">
      <span class="process-mini-stage-icon"><img src="${iconoVisualDesdeEstado(estado)}" alt=""></span>
      <span class="process-mini-stage-label">${escapeHtml(label)}</span>
    </button>
  `;

  container.innerHTML = `
    <div class="process-mini-shell">
      <div class="process-mini-top">
        <button class="process-mini-back" id="btnBackProcesoDireccion" type="button" aria-label="Volver">
          <img src="/assets/iconos/regresar.png" alt="Volver">
        </button>
        <div class="process-mini-chip">PROCESO CONSTRUCTIVO</div>
        <div class="process-mini-spacer"></div>
      </div>

      <div class="process-mini-summary">
        ${renderProcessActionsDireccion(dto)}

        <div class="process-mini-left">
          <div class="process-mini-school">${escapeHtml(dto.nombreEscuela ?? '')}</div>
          <div class="process-mini-meta">Tipo de obra: <span>${escapeHtml(dto.tipoObra ?? '')}</span></div>
          <div class="process-mini-meta">Tipo de edificación: <span>${escapeHtml(dto.tipoEdificacion ?? '')}</span></div>
          <div class="process-mini-meta">Constructor: <span>${escapeHtml(dto.quienEnvia ?? '—')}</span></div>
          <div class="process-mini-meta">Supervisor: <span>${escapeHtml(dto.supervisorAsignado ?? '—')}</span></div>
        </div>

        <div class="process-mini-right">
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

function renderBloqueDireccion(dto, bloque) {
  const container = document.getElementById('direccionBloqueContent');
  if (!container) return;

  const stageBtn = (nombre, etapa) => {
    const estadoReal = resolverEstado(dto, etapa);
    const estadoVisual = claseVisualDesdeEstado(estadoReal);
    return `
      <button class="process-mini-stage status-${estadoVisual} compact-stage" type="button" data-etapa="${etapa}" data-nombre="${nombre}" data-estado="${estadoVisual}">
        <span class="process-mini-stage-icon"><img src="${iconoVisualDesdeEstado(estadoReal)}" alt=""></span>
        <span class="process-mini-stage-label">${escapeHtml(nombre)}</span>
      </button>
    `;
  };

  const subBloqueBtn = (nombre, subbloque, clavesHijas = []) => {
    const estadoReal = resolverEstadoGrupo(dto, clavesHijas);
    const estadoVisual = claseVisualDesdeEstado(estadoReal);
    return `
      <button class="process-mini-stage status-${estadoVisual} compact-stage" type="button" data-subbloque="${subbloque}" data-estado="${estadoVisual}">
        <span class="process-mini-stage-icon"><img src="${iconoVisualDesdeEstado(estadoReal)}" alt=""></span>
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
    const claseNivel = claseAcordeonDesdeClaves(dto, [...clavesVerticales, ...clavesHorizontales, ...(incluirOtros ? clavesOtros : [])]);
    const claseVerticales = claseAcordeonDesdeClaves(dto, clavesVerticales);
    const claseHorizontales = claseAcordeonDesdeClaves(dto, clavesHorizontales);
    const claseOtros = claseAcordeonDesdeClaves(dto, clavesOtros);

    return `
      <div class="structure-accordion ${claseNivel}">
        <button class="structure-accordion-toggle ${claseNivel}" type="button">
          <span class="structure-accordion-title">Estructura nivel ${nivel}</span>
          <span class="structure-accordion-arrow"><img src="/assets/iconos/abajo.png" alt=""></span>
        </button>
        <div class="structure-accordion-body">
          <div class="structure-accordion nested ${claseVerticales}">
            <button class="structure-accordion-toggle ${claseVerticales}" type="button">
              <span class="structure-accordion-title">Elementos verticales</span>
              <span class="structure-accordion-arrow"><img src="/assets/iconos/abajo.png" alt=""></span>
            </button>
            <div class="structure-accordion-body">
              ${stageBtn('Habilitado de castillos', `estructura_n${nivel}_habilitado_castillos`)}
              ${stageBtn('Habilitado de columnas', `estructura_n${nivel}_habilitado_columnas`)}
              ${subBloqueBtn('Muros', `estructura_n${nivel}_muros`, [`estructura_n${nivel}_habilitado_muros_concreto`,`estructura_n${nivel}_habilitado_cadenas_intermedias`])}
              ${stageBtn('Cimbra', `estructura_n${nivel}_cimbra_verticales`)}
              ${stageBtn('Concreto', `estructura_n${nivel}_concreto_verticales`)}
            </div>
          </div>
          <div class="structure-accordion nested ${claseHorizontales}">
            <button class="structure-accordion-toggle ${claseHorizontales}" type="button">
              <span class="structure-accordion-title">Elementos horizontales</span>
              <span class="structure-accordion-arrow"><img src="/assets/iconos/abajo.png" alt=""></span>
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
                <span class="structure-accordion-arrow"><img src="/assets/iconos/abajo.png" alt=""></span>
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
    html = `<div class="process-mini-list">${stageBtn('Limpieza, trazo y nivelación', 'limpieza_trazo_nivelacion')}</div>`;
  } else if (bloque === 'cimentacion') {
    titulo = 'Cimentación';
    html = `
      <div class="process-mini-list">
        ${stageBtn('Excavación', 'excavacion')}
        ${stageBtn('Plantilla de concreto', 'plantilla_concreto')}
        ${subBloqueBtn('Habilitado del acero de refuerzo', 'cimentacion_acero_refuerzo', ['zapata','contratrabe','columnas_castillos_cimentacion'])}
        ${stageBtn('Cimbra y murete de enrase', 'cimbra_murete_enrase')}
        ${stageBtn('Concreto', 'concreto_cimentacion')}
        ${stageBtn('Habilitado de cadenas', 'habilitado_cadenas_cimentacion')}
        ${stageBtn('Relleno', 'relleno')}
      </div>`;
  } else if (bloque === 'cimentacion_acero_refuerzo') {
    titulo = 'Habilitado del acero de refuerzo';
    html = `<div class="process-mini-list">${stageBtn('Zapata', 'zapata')}${stageBtn('Contratrabe', 'contratrabe')}${stageBtn('Columnas o castillos', 'columnas_castillos_cimentacion')}</div>`;
  } else if (bloque === 'estructura') {
    titulo = 'Estructura';
    const niveles = obtenerNumeroNiveles(dto?.tipoEdificacion);
    html = `<div class="structure-list">${estructuraNivel(1)}${niveles >= 2 ? estructuraNivel(2) : ''}${niveles >= 3 ? estructuraNivel(3) : ''}</div>`;
  } else if (bloque.startsWith('estructura_n') && bloque.endsWith('_muros')) {
    const nivel = bloque.match(/estructura_n(\d+)_muros/)?.[1] || '1';
    titulo = `Muros - nivel ${nivel}`;
    html = `<div class="process-mini-list">${stageBtn('Habilitado de muros de concreto', `estructura_n${nivel}_habilitado_muros_concreto`)}${subBloqueBtn('Mampostería', `estructura_n${nivel}_mamposteria`, [`estructura_n${nivel}_habilitado_cadenas_intermedias`])}</div>`;
  } else if (bloque.startsWith('estructura_n') && bloque.endsWith('_mamposteria')) {
    const nivel = bloque.match(/estructura_n(\d+)_mamposteria/)?.[1] || '1';
    titulo = `Mampostería - nivel ${nivel}`;
    html = `<div class="process-mini-list">${stageBtn('Habilitado de cadenas intermedias', `estructura_n${nivel}_habilitado_cadenas_intermedias`)}</div>`;
  } else if (bloque === 'acabados') {
    titulo = 'Albañilería y acabados';
    html = `<div class="process-mini-list">${stageBtn('Pisos', 'pisos')}${stageBtn('Guarnición', 'guarnicion')}</div>`;
  }

  container.innerHTML = `
    <div class="process-mini-shell">
      <div class="process-mini-top">
        <button class="process-mini-back" id="btnBackBloqueDireccion" type="button" aria-label="Volver"><img src="/assets/iconos/regresar.png" alt="Volver"></button>
        <div class="process-mini-chip">${escapeHtml(titulo)}</div>
        <div class="process-mini-spacer"></div>
      </div>
      ${html}
    </div>`;
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
  if (!archivos.length) return `<div class="etapa-empty">Aún no hay evidencias adjuntas.</div>`;
  return `
    <div class="teams-file-list">
      ${archivos.map(arch => `
        <div class="teams-file-item">
          <div class="t-file-left"><span class="t-file-icon">🖼️</span><span class="t-file-name">${escapeHtml(arch.nombre || 'Evidencia')}</span>${arch.nota ? `<span class="t-file-note-text">— ${escapeHtml(arch.nota)}</span>` : ''}</div>
          <div class="t-file-right"><a href="${escapeHtml(arch.url || '#')}" target="_blank" rel="noopener noreferrer">Ver evidencia</a></div>
        </div>`).join('')}
    </div>`;
}

function renderEtapaDireccion(etapaKey, etapaNombre, detalleEtapa) {
  const container = document.getElementById('direccionEtapaContent');
  if (!container) return;

  const titulo = etapaNombre || 'Etapa';
  const observacion = detalleEtapa?.ultimaObservacion;
  const entrega = detalleEtapa?.entregaActual;
  const archivos = entrega?.archivos || [];

  container.innerHTML = `
    <div class="etapa-mini-shell">
      <div class="etapa-mini-top">
        <button class="process-mini-back" id="btnBackEtapaDireccion" type="button" aria-label="Volver"><img src="/assets/iconos/regresar.png" alt="Volver"></button>
        <div class="process-mini-chip">${escapeHtml(titulo.toUpperCase())}</div>
        <button class="etapa-mini-history" id="btnHistoryDireccion" type="button" title="Historial"><img src="/assets/iconos/historial.png" alt="Historial"></button>
      </div>

      <div class="etapa-mini-grid">
        <div class="etapa-card etapa-card-observaciones">
          <div class="etapa-card-title">Observaciones del supervisor</div>
          ${observacion ? `
            <div class="historial-card-body">
              <div class="historial-user">${escapeHtml(observacion.usuarioNombre || '—')}</div>
              <div class="historial-date">${escapeHtml(observacion.fecha || '')}</div>
              <div class="historial-text">${escapeHtml(observacion.mensaje || '')}</div>
            </div>` : `<div class="etapa-empty">Sin observaciones por el momento.</div>`}
        </div>

        <div class="etapa-card etapa-card-entrega">
          <div class="etapa-card-title">Trabajo del constructor</div>
          ${entrega ? `
            <div class="submission-info-card">
              <div class="sic-body">
                <div class="sic-field"><span class="sic-label">Entregado por</span><span class="sic-value">${escapeHtml(entrega.usuarioNombre || '—')}</span></div>
                <div class="sic-field"><span class="sic-label">Fecha de subida</span><span class="sic-value">${escapeHtml(entrega.fechaSubida || '—')}</span></div>
                <div class="sic-field"><span class="sic-label">Número de versión</span><span class="sic-value">${escapeHtml(entrega.version ?? '')}</span></div>
                <div class="sic-field"><span class="sic-label">Estado de la evaluación</span><div class="sic-value"><span class="historial-type ${getBadgeClass(entrega.estadoEntrega)}">${escapeHtml(formatearTexto(entrega.estadoEntrega))}</span></div></div>
              </div>
            </div>
            ${renderArchivosEvidencia(archivos)}` : `<div class="etapa-empty">Aún no hay entrega del constructor para esta etapa.</div>`}
        </div>
      </div>
    </div>`;
}

function getRoleClass(rolStr) {
  const s = (rolStr || '').toLowerCase();
  if (s.includes('supervisor')) return 'role-supervisor';
  if (s.includes('constructor') || s.includes('contratista')) return 'role-constructor';
  return '';
}

function renderHistorialDireccion(historial) {
  const container = document.getElementById('direccionHistorialContent');
  if (!container) return;

  const items = (Array.isArray(historial) ? historial : []).filter(item => {
    const tipo = String(item?.tipo || item?.tipoEvento || item?.tipoEntrega || '').toLowerCase();
    return !tipo.includes('borrador');
  });

  container.innerHTML = `
    <div class="process-mini-shell">
      <div class="process-mini-top">
        <button class="process-mini-back" id="btnBackHistorialDireccion" type="button" aria-label="Volver"><img src="/assets/iconos/regresar.png" alt="Volver"></button>
        <div class="process-mini-chip">HISTORIAL</div>
        <div class="process-mini-spacer"></div>
      </div>
      <div class="historial-list">
        ${items.length ? items.map(item => `
          <div class="historial-card ${getBadgeClass(item.tipo)}">
            <div class="historial-card-header">
              <div class="historial-user">${escapeHtml(item.usuarioNombre || '—')}${item.usuarioRol ? `<span class="historial-role ${getRoleClass(item.usuarioRol)}">${escapeHtml(item.usuarioRol)}</span>` : ''}</div>
              <div class="historial-date">${escapeHtml(item.fecha || '')}</div>
            </div>
            <div class="historial-card-body">
              <div class="historial-type ${getBadgeClass(item.tipo)}">${escapeHtml((item.tipo || '').toLowerCase())}</div>
              <div class="historial-text">${escapeHtml(item.mensaje || item.descripcion || '')}</div>
              ${item.urlArchivo ? `<a class="historial-file" href="${item.urlArchivo}" target="_blank" rel="noopener noreferrer">📄 ${escapeHtml(item.nombreArchivo || 'Ver archivo adjunto')}</a>` : ''}
            </div>
          </div>`).join('') : `<div class="empty" style="margin-top:20px;">No hay historial registrado todavía.</div>`}
      </div>
    </div>`;
}

function bindTabs() {
  document.querySelectorAll('#direccionProjectTabs .tab').forEach(tab => {
    if (tab.dataset.bound === 'true') return;
    tab.dataset.bound = 'true';
    tab.addEventListener('click', async () => {
      currentEstado = tab.dataset.estado;
      await loadAndRenderProjects();
    });
  });
}

function bindSearch() {
  const searchInput = document.getElementById('searchDireccion');
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

function bindPanelEvents() {
  document.getElementById('btnBackProcesoDireccion')?.addEventListener('click', volverAListaProyectos);
  document.getElementById('btnBackBloqueDireccion')?.addEventListener('click', volverAProceso);
  document.getElementById('btnBackEtapaDireccion')?.addEventListener('click', volverABloque);
  document.getElementById('btnBackHistorialDireccion')?.addEventListener('click', volverAEtapa);
  document.getElementById('btnHistoryDireccion')?.addEventListener('click', openHistorial);

  document.querySelectorAll('#direccionProcesoContent .process-mini-stage[data-bloque]').forEach(btn => {
    btn.onclick = () => {
      const estado = (btn.dataset.estado || '').toLowerCase();
      if (estado === 'locked') return;
      openBloque(btn.dataset.bloque);
    };
  });

  document.querySelectorAll('#direccionBloqueContent .structure-accordion-toggle').forEach(toggle => {
    toggle.onclick = () => toggle.closest('.structure-accordion')?.classList.toggle('open');
  });

  document.querySelectorAll('#direccionBloqueContent .process-mini-stage[data-subbloque]').forEach(btn => {
    btn.onclick = () => {
      const estado = (btn.dataset.estado || '').toLowerCase();
      if (estado === 'locked') return;
      openSubBloque(btn.dataset.subbloque);
    };
  });

  document.querySelectorAll('#direccionBloqueContent .process-mini-stage[data-etapa]').forEach(btn => {
    btn.onclick = () => {
      const estado = (btn.dataset.estado || '').toLowerCase();
      if (estado === 'locked') return;
      openEtapa(btn.dataset.etapa, btn.dataset.nombre || btn.textContent.trim());
    };
  });
  
  document.querySelectorAll('[data-doc-inicial]').forEach(btn => {
      btn.onclick = () => {
          abrirDocumentacionInicialDireccion(btn.dataset.docInicial);
      };
  });

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

      abrirDocumentacionInicialDireccion(btn.dataset.moreDoc);
    };
  });
}

async function abrirDocumentacionInicial(idProyecto) {
  try {
    const data = await api.fetchDocumentacionInicialProyecto(idProyecto);
    abrirModalDocumentacionInicial(data, { puedeSubir: false });
  } catch (e) {
    await showCustomAlert(
      'No se pudo cargar la documentación inicial: ' + e.message,
      'Error'
    );
  }
}

async function loadAndRenderProjects() {
  if (!isProjectsView()) return;
  try {
    showDireccionView('projects');
    syncTabsVisually();
    currentList = await api.fetchProyectos(currentEstado);

    const searchInput = document.getElementById('searchDireccion');
    const q = (searchInput?.value || '').toLowerCase().trim();
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
  } catch (e) {
    await showCustomAlert(`No se pudieron cargar los proyectos: ${e.message}`, 'Error');
  }
}

async function openDetalleProyecto(idProyecto) {
  try {
    currentProcesoDto = await api.fetchDetalleProyecto(idProyecto);
    currentBloqueKey = null;
    bloqueStack = [];
    renderProcesoDireccion(currentProcesoDto);
    showDireccionView('proceso');
    bindPanelEvents();
    document.getElementById('direccionProcesoView')?.scrollTo(0,0);
  } catch (e) {
    await showCustomAlert(`No se pudo cargar el detalle: ${e.message}`, 'Error');
  }
}

function openBloque(bloque) {
  if (!currentProcesoDto) return;
  bloqueStack = [];
  currentBloqueKey = bloque;
  renderBloqueDireccion(currentProcesoDto, bloque);
  showDireccionView('bloque');
  bindPanelEvents();
  document.getElementById('direccionBloqueView')?.scrollTo(0,0);
}

function openSubBloque(subbloque) {
  if (!currentProcesoDto) return;
  if (currentBloqueKey) bloqueStack.push(currentBloqueKey);
  currentBloqueKey = subbloque;
  renderBloqueDireccion(currentProcesoDto, subbloque);
  showDireccionView('bloque');
  bindPanelEvents();
  document.getElementById('direccionBloqueView')?.scrollTo(0,0);
}

async function openEtapa(etapaKey, etapaNombre) {
  if (!currentProcesoDto) return;
  try {
    currentEtapaKey = etapaKey;
    currentEtapaNombre = etapaNombre;
    const detalleEtapa = await api.fetchDetalleEtapaProyecto(currentProcesoDto.idProyecto, etapaKey);
    renderEtapaDireccion(etapaKey, etapaNombre, detalleEtapa);
    showDireccionView('etapa');
    bindPanelEvents();
    document.getElementById('direccionEtapaView')?.scrollTo(0,0);
  } catch (e) {
    await showCustomAlert(`No se pudo cargar la etapa: ${e.message}`, 'Error');
  }
}

async function openHistorial() {
  if (!currentProcesoDto || !currentEtapaKey) return;
  try {
    const historial = await api.fetchHistorialEtapaProyecto(currentProcesoDto.idProyecto, currentEtapaKey);
    renderHistorialDireccion(historial);
    showDireccionView('historial');
    bindPanelEvents();
    document.getElementById('direccionHistorialView')?.scrollTo(0,0);
  } catch (e) {
    await showCustomAlert(`No se pudo cargar el historial: ${e.message}`, 'Error');
  }
}

async function abrirDocumentacionInicialDireccion(idProyecto) {
    try {
        const data = await api.fetchDocumentacionInicialProyecto(idProyecto);
        abrirModalDocumentacionInicial(data, { puedeSubir: false });
    } catch (e) {
        await showCustomAlert(
            'No se pudo cargar la documentación inicial: ' + e.message,
            'Error'
        );
    }
}

function volverAListaProyectos() {
  bloqueStack = [];
  currentBloqueKey = null;
  currentEtapaKey = null;
  currentEtapaNombre = null;
  currentProcesoDto = null;
  showDireccionView('projects');
}

function volverAProceso() {
  if (!currentProcesoDto) {
    showDireccionView('proceso');
    return;
  }
  if (bloqueStack.length > 0) {
    currentBloqueKey = bloqueStack.pop();
    renderBloqueDireccion(currentProcesoDto, currentBloqueKey);
    showDireccionView('bloque');
    bindPanelEvents();
    document.getElementById('direccionBloqueView')?.scrollTo(0,0);
    return;
  }
  currentBloqueKey = null;
  renderProcesoDireccion(currentProcesoDto);
  showDireccionView('proceso');
  bindPanelEvents();
}

function volverABloque() { showDireccionView('bloque'); }
function volverAEtapa() { showDireccionView('etapa'); }

function initProjectsModule() {
  if (!isProjectsView()) return;
  bindTabs();
  bindSearch();
  bindPanelEvents();
  loadAndRenderProjects();
}

document.addEventListener('DOMContentLoaded', initProjectsModule);
window.addEventListener('panelLoaded', (e) => {
  if (e.detail?.view === 'proyectos') initProjectsModule();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.project-more-wrap')) {
        document.querySelectorAll('.project-more-menu.open')
            .forEach(menu => menu.classList.remove('open'));
    }
});
