// ui.js

// Alertas Globales
const customAlert = document.getElementById('customAlert');
const customAlertTitle = document.getElementById('customAlertTitle');
const customAlertMessage = document.getElementById('customAlertMessage');
const customAlertOk = document.getElementById('customAlertOk');
const customAlertCancel = document.getElementById('customAlertCancel');

export function addCacheBuster(url) {
    if (!url) return url;
    return url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
}

export function renderProfilePhoto(url) {
    const profileImg = document.getElementById('profileImg');
    const profileFallback = document.getElementById('profileFallback');

    if (!profileImg || !profileFallback) return;

    if (!url || url.trim() === '') {
        profileImg.style.display = 'none';
        profileFallback.style.display = 'block';
        return;
    }

    profileImg.onload = () => {
        profileImg.style.display = 'block';
        profileFallback.style.display = 'none';
    };

    profileImg.onerror = () => {
        profileImg.style.display = 'none';
        profileFallback.style.display = 'block';
    };

    profileImg.src = addCacheBuster(url);
}

export function closeCustomAlert() {
    customAlert?.classList.remove('open');
    customAlert?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

export function showCustomAlert(message, title = 'Atención') {
    return new Promise((resolve) => {
        customAlertTitle.textContent = title;
        customAlertMessage.textContent = message;
        customAlertCancel.style.display = 'none';

        customAlert.classList.add('open');
        customAlert.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const handleOk = () => {
            closeCustomAlert();
            customAlertOk.removeEventListener('click', handleOk);
            resolve(true);
        };

        customAlertOk.addEventListener('click', handleOk);
    });
}

export function showCustomConfirm(message, title = 'Confirmar acción') {
    return new Promise((resolve) => {
        customAlertTitle.textContent = title;
        customAlertMessage.textContent = message;
        customAlertCancel.style.display = 'inline-flex';

        customAlert.classList.add('open');
        customAlert.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const handleOk = () => { cleanup(); resolve(true); };
        const handleCancel = () => { cleanup(); resolve(false); };

        const cleanup = () => {
            closeCustomAlert();
            customAlertOk.removeEventListener('click', handleOk);
            customAlertCancel.removeEventListener('click', handleCancel);
        };

        customAlertOk.addEventListener('click', handleOk);
        customAlertCancel.addEventListener('click', handleCancel);
    });
}

export function openModal(modalEl, backdropEl) {
    modalEl?.classList.add('open');
    backdropEl?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeModal(modalEl, backdropEl) {
    modalEl?.classList.remove('open');
    backdropEl?.classList.remove('open');
    document.body.style.overflow = '';
}

export function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function estadoDotClass(estado) {
    const s = (estado || '').toUpperCase();
    if (s === 'ACTIVO') return 'dot-aprobada';
    if (s === 'INACTIVO') return 'dot-pendiente';
    if (s === 'FINALIZADO') return 'dot-rechazada';
    return 'dot-pendiente';
}

export function renderCards(items, onDetailClick) {
    const list = document.getElementById('constructorProjectsList');
    const empty = document.getElementById('constructorProjectsEmpty');
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
        p1.textContent = `Supervisor: ${it.supervisor ?? '—'}`;

        const p2 = document.createElement('span');
        p2.textContent = `Fecha: ${it.fechaAprobacion ?? ''}`;

        meta.appendChild(dot);
        meta.appendChild(p1);
        meta.appendChild(p2);
        left.appendChild(school);
        left.appendChild(meta);

        const btn = document.createElement('button');
        btn.className = 'btn-detail';
        btn.type = 'button';
        btn.textContent = 'Ver detalle';
        btn.addEventListener('click', () => onDetailClick(it.idProyecto));

        card.appendChild(left);
        card.appendChild(btn);
        list.appendChild(card);
    }
}

export function renderDetalleProyecto(dto) {
    const badgeEstado = document.getElementById('badgeEstado');
    const detalleMeta = document.getElementById('detalleMeta');
    const detalleBody = document.getElementById('detalleBody');

    if (!badgeEstado || !detalleMeta || !detalleBody) return;

    badgeEstado.textContent = (dto.estadoProyecto || '').toUpperCase();

    detalleMeta.innerHTML = `
    <div>Proyecto #${escapeHtml(dto.idProyecto)} • Solicitud #${escapeHtml(dto.idSolicitud)}</div>
    <div>Fecha de aprobación: ${escapeHtml(dto.fechaAprobacion ?? '')}</div>
    <div>Supervisor asignado: ${escapeHtml(dto.supervisorAsignado ?? '—')}</div>
  `;

    detalleBody.innerHTML = `
    <div class="placeholder-detail">
      <div class="ph-grid">
        <div class="ph-box">
          <div class="ph-label">Escuela</div>
          <div class="ph-value">${escapeHtml(dto.nombreEscuela)}</div>
        </div>
        <div class="ph-box">
          <div class="ph-label">Ubicación</div>
          <div class="ph-value">${escapeHtml(dto.estado)}, ${escapeHtml(dto.municipio)}, ${escapeHtml(dto.ciudad)}</div>
        </div>
        <div class="ph-box">
          <div class="ph-label">Tipo de obra</div>
          <div class="ph-value">${escapeHtml(dto.tipoObra)}</div>
        </div>
        <div class="ph-box">
          <div class="ph-label">Tipo de edificación</div>
          <div class="ph-value">${escapeHtml(dto.tipoEdificacion ?? '')}</div>
        </div>
      </div>
      <div class="ph-note">aqui después para subir evidencias</div>
    </div>
  `;
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

    if (
        estados.some(estado =>
            estado === 'EN_PROCESO' ||
            estado === 'CON_OBSERVACIONES' ||
            estado === 'DISPONIBLE' ||
            estado === 'APROBADA'
        )
    ) {
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

    for (let nivel = 1;nivel <= niveles;nivel++) {
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

function claseAcordeonDesdeClaves(dto, claves = []) {
    return `status-${claseVisualDesdeEstado(resolverEstadoGrupo(dto, claves))}`;
}

function iconoVisualDesdeEstado(estado) {
    const e = normalizarEstadoEtapa(estado);

    if (e === 'APROBADA') return '/assets/iconos/listo.png';
    if (e === 'EN_PROCESO' || e === 'CON_OBSERVACIONES' || e === 'DISPONIBLE') return '/assets/iconos/proceso.png';
    return '/assets/iconos/bloqueado.png';
}

export function renderProcesoProyecto(dto) {
    const container = document.getElementById('constructorProcesoContent');
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

    const acabadosClaves = [
        'pisos',
        'guarnicion'
    ];

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
  
  const renderProcessActions = (dto) => `
    <div class="process-actions">
      <button class="btn-doc-inicial" type="button" data-doc-inicial="${dto.idProyecto}">
        Documentación inicial
      </button>

      <div class="project-more-wrap">
        <button class="project-more-trigger" type="button" data-more-trigger aria-label="Opciones">
          ⋮
        </button>

        <div class="project-more-menu">
          <button class="project-more-option" type="button" data-more-doc="${dto.idProyecto}">
            Documentación inicial
          </button>
        </div>
      </div>
    </div>
  `;

    container.innerHTML = `
    <div class="process-mini-shell">
      <div class="process-mini-top">
        <button class="process-mini-back" id="btnBackProceso" type="button" aria-label="Volver">
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
        </div>

        <div class="process-mini-right">
		<div class="process-mini-summary-top">
		  ${renderProcessActions(dto)}
		</div>
          <div class="process-mini-progress-label">Avance en %</div>
          <div class="process-mini-track">
            <div class="process-mini-fill" style="width: 25%;"></div>
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

export function renderBloqueProyecto(dto, bloque) {
    const container = document.getElementById('constructorBloqueContent');
    if (!container) return;

    const stageBtn = (nombre, etapa) => {
        const estadoReal = resolverEstado(dto, etapa);
        const estadoVisual = claseVisualDesdeEstado(estadoReal);
        const icono = iconoVisualDesdeEstado(estadoReal);

        return `
        <button
          class="process-mini-stage status-${estadoVisual} compact-stage"
          type="button"
          data-etapa="${etapa}"
          data-nombre="${nombre}"
          data-estado="${estadoVisual}">
          <span class="process-mini-stage-icon">
            <img src="${icono}" alt="">
          </span>
          <span class="process-mini-stage-label">${escapeHtml(nombre)}</span>
        </button>
      `;
    };

    const subBloqueBtn = (nombre, subbloque, clavesHijas = []) => {
        const estadoReal = resolverEstadoGrupo(dto, clavesHijas);
        const estadoVisual = claseVisualDesdeEstado(estadoReal);
        const icono = iconoVisualDesdeEstado(estadoReal);

        return `
        <button
          class="process-mini-stage status-${estadoVisual} compact-stage"
          type="button"
          data-subbloque="${subbloque}"
          data-estado="${estadoVisual}">
          <span class="process-mini-stage-icon">
            <img src="${icono}" alt="">
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

    if (bloque === 'cimentacion') {
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

        const tipo = (dto.tipoEdificacion ?? '').toUpperCase();
        const niveles = tipo === 'U3C' ? 3 : (tipo === 'U2C' ? 2 : 1);

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
    } else if (bloque === 'preliminares') {
        titulo = 'Trabajos preliminares';
        html = `
        <div class="process-mini-list">
          ${stageBtn('Limpieza, trazo y nivelación', 'limpieza_trazo_nivelacion')}
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
          <button class="process-mini-back" id="btnBackBloque" type="button" aria-label="Volver">
            <img src="/assets/iconos/regresar.png" alt="Volver">
          </button>
          <div class="process-mini-chip">${escapeHtml(titulo)}</div>
          <div class="process-mini-spacer"></div>
        </div>

        ${html}
      </div>
    `;
}

export function renderEtapaProyecto(dtoProceso, etapaKey, etapaNombre, detalleEtapa) {
    const container = document.getElementById('constructorEtapaContent');
    if (!container) return;

    const relojIcon = '/assets/iconos/historial.png';
    const titulo = etapaNombre || 'Etapa';

    const observacion = detalleEtapa?.ultimaObservacion;
    const entrega = detalleEtapa?.entregaActual;
    const archivos = entrega?.archivos || [];

    const mostrarObservacion = observacion && entrega?.estadoEntrega === 'CON_OBSERVACIONES';
	
	// Función auxiliar para asignar color al badge del estado
	    const getBadgeClass = (tipoStr) => {
	        const s = (tipoStr || '').toLowerCase();
	        if (s.includes('aprobada') || s.includes('aprobado')) return 'badge-aprobacion';
	        if (s.includes('observacion') || s.includes('observaciones')) return 'badge-observacion';
	        if (s.includes('borrador')) return 'badge-borrador';
	        return 'badge-entrega'; // Aplica para ENVIADA
	    };

    // Generar la lista visual de archivos
    let listaArchivosHtml = '';
    if (archivos.length > 0) {
        listaArchivosHtml = '<div class="teams-file-list" style="margin-top: 15px; margin-bottom: 20px;">';
        archivos.forEach(arch => {
            
			const currentNota = (arch.nota && arch.nota !== 'SIN_NOTA') ? arch.nota : '';
			
			let notaVisual = '';
			            if (entrega?.estadoEntrega === 'BORRADOR') {
			                notaVisual = `
			                    <input type="text" class="t-file-note-input" 
			                           data-path="${escapeHtml(arch.path)}" 
			                           value="${escapeHtml(currentNota)}" 
			                           placeholder="Agrega una nota para esta imagen" 
			                           autocomplete="off">
			                `;
			            } else if (currentNota) {
			                notaVisual = `<span class="t-file-note-text">— ${escapeHtml(currentNota)}</span>`;
			            }
			
			listaArchivosHtml += `
			
                <div class="teams-file-item" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;">
				<div class="t-file-left" style="flex: 1; display: flex; align-items: center; gap: 12px; overflow: hidden; min-width: 0;">
				                    <span class="t-file-icon" style="flex-shrink: 0;">🖼️</span>
				                    <span class="t-file-name" style="flex-shrink: 0; max-width: 200px;">${escapeHtml(arch.nombre)}</span>
				                    ${notaVisual}
				                </div>
					
					
                    <div class="t-file-right">
                        <button class="t-btn-dots" type="button">•••</button>
                        <div class="t-dropdown-menu">
                            <a href="${arch.url}" target="_blank" class="t-drop-item">
                                <img src="/assets/iconos/verFoto.png" alt="Ver" class="t-drop-icon"> Abrir en línea
                            </a>
                            ${entrega?.estadoEntrega === 'BORRADOR' ? `
                                <div class="t-drop-divider"></div>
                                <button class="t-drop-item btn-quitar-imagen" data-path="${escapeHtml(arch.path)}">
                                    <img src="/assets/iconos/eliminar.png" alt="Quitar" class="t-drop-icon"> Quitar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        listaArchivosHtml += '</div>';
    }
	
	// Función para capitalizar texto y quitar guiones bajos
	const formatearTexto = (texto) => {
	    if (!texto) return '';
	    
	    // Cambiamos los guiones bajos por espacios
	    const textoLimpio = texto.replace(/_/g, ' ');
	    
	    // Aplicamos la primera letra mayúscula y el resto en minúsculas
	    return textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1).toLowerCase();
	};

    const tuTrabajoCardHtml = `
        <div class="etapa-card etapa-card-entrega">
          <div class="etapa-card-title">Tu trabajo</div>

		  ${entrega ? `
		  		                  <div class="submission-info-card">
		  		                      <div class="sic-header">
		  		                          <h4 class="sic-header-title">Detalles del reporte</h4>
		  		                      </div>
		  		                      <div class="sic-body">
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
		  		                ` : ''}

          <div id="enlaceReporte_${etapaKey}" style="text-align: center; margin-bottom: 12px;"></div>

          ${(entrega?.estadoEntrega === 'ENVIADA' || entrega?.estadoEntrega === 'APROBADA') ? `
            ${listaArchivosHtml}
            <div style="text-align: center; padding: 15px; background: #f0f4f8; border-radius: 8px; color: #4a5568; font-size: 0.95rem; margin-top: 16px;">
                <strong style="display: block; margin-bottom: 5px;">
                    ${entrega?.estadoEntrega === 'ENVIADA' ? 'En revisión' : 'Etapa aprobada'}
                </strong>
                ${entrega?.estadoEntrega === 'ENVIADA'
                ? 'Has enviado tu trabajo. Espera la evaluación de tu supervisor.'
                : 'Este reporte ya fue evaluado y aprobado.'}
					
					${entrega?.estadoEntrega === 'APROBADA' ? `
					                    <div style="margin-top: 14px;">
					                        <button id="btnDescargarPdf_${etapaKey}" class="btn-descargar-pdf" type="button">
					                            Descargar en PDF
					                        </button>
					                    </div>
					                ` : ''}
            </div>
          ` : `
            ${listaArchivosHtml} 
			<div class="etapa-upload-actions">
			               <input type="file" id="reporteFile_${etapaKey}" accept="image/png, image/jpeg, image/webp" hidden>

			               <button class="etapa-btn-upload" id="btnUploadReporte_${etapaKey}" type="button">
			                  ${entrega?.estadoEntrega === 'CON_OBSERVACIONES' ? 'Subir corrección' : 'Agregar imagen'}
			               </button>

			               ${entrega?.estadoEntrega === 'BORRADOR' && archivos.length > 0 ? `
			                  <button class="etapa-btn-send" id="btnSendReporte_${etapaKey}" type="button">Entregar</button>
			               ` : ''}
			            </div>
          `}
        </div>
    `;

    const contenidoPrincipalHtml = mostrarObservacion
        ? `
          <div class="etapa-mini-grid">
            <div class="etapa-card etapa-card-observaciones">
              <div class="etapa-card-title">Observaciones del supervisor</div>
              <div class="historial-card-body">
                <div class="historial-user">${escapeHtml(observacion.usuarioNombre || '—')}</div>
                <div class="historial-date">${escapeHtml(observacion.fecha || '')}</div>
                <div class="historial-text">${escapeHtml(observacion.mensaje || '')}</div>
              </div>
            </div>
            ${tuTrabajoCardHtml}
          </div>
        `
        : `
          <div style="margin-bottom: 14px;">
            ${tuTrabajoCardHtml}
          </div>
        `;

    container.innerHTML = `
        <div class="etapa-mini-shell">
          <div class="etapa-mini-top">
            <button class="process-mini-back" id="btnBackEtapa" type="button"><img src="/assets/iconos/regresar.png"></button>
            <div class="process-mini-chip">${escapeHtml(titulo.toUpperCase())}</div>
            <button class="etapa-mini-history" id="btnHistoryEtapa" type="button"><img src="${relojIcon}"></button>
          </div>
          ${contenidoPrincipalHtml}
        </div>
    `;
}

export function fillSelect(selectEl, items, placeholder = 'Seleccionar') {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="" disabled selected>${escapeHtml(placeholder)}</option>`;

    for (const item of items || []) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.nombre;
        selectEl.appendChild(option);
    }
}

export function setActiveNav(navId) {
    document.querySelectorAll('.sidebar .nav-item').forEach(x => x.classList.remove('active'));
    if (navId) {
        document.getElementById(navId)?.classList.add('active');
    }
}

export function syncSidebarWithUrl(view) {
    if (view === 'password') {
        setActiveNav('navPassword');
        return;
    }
    setActiveNav('navProyectos');
}

export function closeProfileMenu() {
    document.getElementById('profileMenuDropdown')?.classList.remove('open');
}

export function toggleProfileMenu() {
    document.getElementById('profileMenuDropdown')?.classList.toggle('open');
}

export function renderHistorialProyecto(historial) {
    const container = document.getElementById('constructorHistorialContent');
    if (!container) return;

    const items = Array.isArray(historial) ? historial : [];

    // Funcin auxiliar para asignar color al badge
    const getBadgeClass = (tipoStr) => {
        const s = (tipoStr || '').toLowerCase();
        if (s.includes('aprobacion') || s.includes('aprobado')) return 'badge-aprobacion';
        if (s.includes('observacion')) return 'badge-observacion';
        if (s.includes('borrador')) return 'badge-borrador';
        return 'badge-entrega';
    };

    // Función auxiliar para renderizar la lista de archivos
    const renderArchivosHtml = (archivos) => {
        if (!archivos || archivos.length === 0) return '';

        let html = '<div class="teams-file-list" style="margin-top: 15px;">';
        archivos.forEach(arch => {
			
			const currentNota = (arch.nota && arch.nota !== 'SIN_NOTA') ? arch.nota : '';
			            
			            let notaVisual = '';
			            if (currentNota) {
notaVisual = `<span class="t-file-note-text">— ${escapeHtml(currentNota)}</span>`;
			            }
						
            html += `
	                <div class="teams-file-item" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;">
	                    <div class="t-file-left" style="flex: 1; display: flex; align-items: center; gap: 12px; overflow: hidden; min-width: 0;">
	                        <span class="t-file-icon">🖼️</span>
	                        <span class="t-file-name">${escapeHtml(arch.nombre)}</span>
							${notaVisual}
	                    </div>
	                    <div class="t-file-right">
	                        <a href="${escapeHtml(arch.url)}" target="_blank" class="historial-file" style="margin-top: 0; padding: 4px 8px;">Ver imagen</a>
	                    </div>
	                </div>
	            `;
        });
        html += '</div>';
        return html;
    };

    container.innerHTML = `
      <div class="process-mini-shell">
        <div class="process-mini-top">
          <button class="process-mini-back" id="btnBackHistorial" type="button" aria-label="Volver">
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
		                          ${item.usuarioRol ? `<span class="historial-role">${escapeHtml(item.usuarioRol)}</span>` : ''}
		                        </div>
				                <div class="historial-date">${escapeHtml(item.fecha || '')}</div>
				              </div>
				              <div class="historial-card-body">
				                <div class="historial-type ${getBadgeClass(item.tipo)}">${escapeHtml((item.tipo || '').toLowerCase())}</div>
				                <div class="historial-text">${escapeHtml(item.mensaje || item.descripcion || '')}</div>
								
								${renderArchivosHtml(item.archivos)}
								
				              </div>
				            </div>
				          `).join('') : `
				            <div class="empty" style="margin-top: 20px;">No hay historial registrado todavía.</div>
				          `}
				        </div>
		      </div>
    `;
}