function addCacheBuster(url) {
  if (!url) return url;
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
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
  if (s === 'PENDIENTE') return 'dot-pendiente';
  if (s === 'APROBADA') return 'dot-aprobada';
  if (s === 'RECHAZADA') return 'dot-rechazada';
  if (s === 'ACTIVO') return 'dot-aprobada';
  if (s === 'INACTIVO') return 'dot-pendiente';
  if (s === 'FINALIZADO') return 'dot-rechazada';
  return 'dot-pendiente';
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

export function showCustomAlert(message, title = 'Atención') {
  const customAlert = document.getElementById('customAlert');
  const customAlertBackdrop = document.getElementById('customAlertBackdrop');
  const customAlertTitle = document.getElementById('customAlertTitle');
  const customAlertMessage = document.getElementById('customAlertMessage');
  const customAlertOk = document.getElementById('customAlertOk');
  const customAlertCancel = document.getElementById('customAlertCancel');

  return new Promise((resolve) => {
    if (!customAlert || !customAlertBackdrop) {
      window.alert(message);
      resolve(true);
      return;
    }

    if (customAlertTitle) customAlertTitle.textContent = title;
    if (customAlertMessage) customAlertMessage.textContent = message;
    if (customAlertCancel) customAlertCancel.style.display = 'none';

    openModal(customAlert, customAlertBackdrop);
    customAlert.setAttribute('aria-hidden', 'false');
    customAlertBackdrop.setAttribute('aria-hidden', 'false');

    const handleOk = () => {
      customAlertOk?.removeEventListener('click', handleOk);
      closeCustomAlert();
      resolve(true);
    };

    customAlertOk?.addEventListener('click', handleOk);
  });
}

export function showCustomConfirm(message, title = 'Confirmar acción') {
  const customAlert = document.getElementById('customAlert');
  const customAlertBackdrop = document.getElementById('customAlertBackdrop');
  const customAlertTitle = document.getElementById('customAlertTitle');
  const customAlertMessage = document.getElementById('customAlertMessage');
  const customAlertOk = document.getElementById('customAlertOk');
  const customAlertCancel = document.getElementById('customAlertCancel');

  return new Promise((resolve) => {
    if (!customAlert || !customAlertBackdrop || !customAlertCancel) {
      resolve(window.confirm(message));
      return;
    }

    if (customAlertTitle) customAlertTitle.textContent = title;
    if (customAlertMessage) customAlertMessage.textContent = message;
    customAlertCancel.style.display = 'inline-flex';

    openModal(customAlert, customAlertBackdrop);
    customAlert.setAttribute('aria-hidden', 'false');
    customAlertBackdrop.setAttribute('aria-hidden', 'false');

    const handleOk = () => { cleanup(); resolve(true); };
    const handleCancel = () => { cleanup(); resolve(false); };

    const cleanup = () => {
      customAlertOk?.removeEventListener('click', handleOk);
      customAlertCancel?.removeEventListener('click', handleCancel);
      closeCustomAlert();
    };

    customAlertOk?.addEventListener('click', handleOk);
    customAlertCancel?.addEventListener('click', handleCancel);
  });
}

export function closeCustomAlert() {
  const customAlert = document.getElementById('customAlert');
  const customAlertBackdrop = document.getElementById('customAlertBackdrop');

  closeModal(customAlert, customAlertBackdrop);
  customAlert?.setAttribute('aria-hidden', 'true');
  customAlertBackdrop?.setAttribute('aria-hidden', 'true');
}

export function setBadge(estado) {
  const badgeEstado = document.getElementById('badgeEstado');
  if (badgeEstado) {
    badgeEstado.textContent = (estado || '').toUpperCase();
  }
}

export function renderCards(items, containerId, emptyId, type, handlers = {}) {
  const list = document.getElementById(containerId);
  const empty = document.getElementById(emptyId);
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
    dot.className = `state-dot ${
      estadoDotClass(type === 'SOLICITUD' ? it.estadoSolicitud : it.estadoProyecto)
    }`;

    const p1 = document.createElement('span');
    p1.textContent = `Constructor: ${it.constructor ?? '—'}`;

    const p2 = document.createElement('span');
    p2.textContent = type === 'SOLICITUD'
      ? `Fecha: ${it.fechaSolicitud ?? ''}`
      : `Supervisor: ${it.supervisor ?? '—'}`;

    meta.appendChild(dot);
    meta.appendChild(p1);
    meta.appendChild(p2);

    left.appendChild(school);
    left.appendChild(meta);

    const btn = document.createElement('button');
    btn.className = 'btn-detail';
    btn.type = 'button';
    btn.textContent = 'Ver detalle';
    btn.addEventListener('click', () => {
      if (type === 'SOLICITUD') handlers.onOpenSolicitud?.(it.idSolicitud);
      else handlers.onOpenProyecto?.(it.idProyecto);
    });

    card.appendChild(left);
    card.appendChild(btn);
    list.appendChild(card);
  }
}

function renderDetalleForm(dto) {
  return `
    <div class="ro-grid ro-1">
      <div class="ro-field">
        <label class="ro-label">Nombre de la escuela</label>
        <input class="ro-input" value="${escapeHtml(dto.nombreEscuela)}" readonly>
      </div>
    </div>

    <div class="ro-grid ro-2">
      <div class="ro-field">
        <label class="ro-label">CCT</label>
        <input class="ro-input" value="${escapeHtml(dto.cct1)}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">CCT (opcional)</label>
        <input class="ro-input" value="${escapeHtml(dto.cct2 ?? '')}" readonly>
      </div>
    </div>

    <div class="ro-grid ro-3">
      <div class="ro-field">
        <label class="ro-label">Estado</label>
        <input class="ro-input" value="${escapeHtml(dto.estado)}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">Municipio</label>
        <input class="ro-input" value="${escapeHtml(dto.municipio)}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">Localidad</label>
        <input class="ro-input" value="${escapeHtml(dto.ciudad)}" readonly>
      </div>
    </div>

    <div class="ro-grid ro-2">
      <div class="ro-field">
        <label class="ro-label">Calle y número</label>
        <input class="ro-input" value="${escapeHtml(dto.calleNumero)}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">C.P.</label>
        <input class="ro-input" value="${escapeHtml(dto.cp)}" readonly>
      </div>
    </div>

    <div class="ro-grid ro-3">
      <div class="ro-field">
        <label class="ro-label">Responsable del inmueble</label>
        <input class="ro-input" value="${escapeHtml(dto.responsableInmueble)}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">Contacto</label>
        <input class="ro-input" value="${escapeHtml(dto.contacto)}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">No. de inmuebles a evaluar</label>
        <input class="ro-input" value="${escapeHtml(String(dto.numInmueblesEvaluar ?? ''))}" readonly>
      </div>
    </div>

    <div class="ro-grid ro-3">
      <div class="ro-field">
        <label class="ro-label">Tipo de obra</label>
        <input class="ro-input" value="${escapeHtml(dto.tipoObra)}" readonly>
      </div>
      <div class="ro-field">
	  <label class="ro-label">Tipo de edificación</label>
	  <input class="ro-input" value="${escapeHtml(dto.tipoEdificacion ?? '')}" readonly>
      </div>
      <div class="ro-field">
        <label class="ro-label">No. de entre ejes</label>
        <input class="ro-input" value="${escapeHtml(String(dto.numEntreEjes ?? ''))}" readonly>
      </div>
    </div>
  `;
}

export function renderDetalleSolicitud(dto) {
  const detalleActions = document.getElementById('detalleActions');
  const detalleProyectoActions = document.getElementById('detalleProyectoActions');
  const detalleMeta = document.getElementById('detalleMeta');
  const detalleBody = document.getElementById('detalleBody');

  if (detalleActions) {
    detalleActions.style.display = (dto.estadoSolicitud || '').toUpperCase() === 'PENDIENTE' ? 'flex' : 'none';
  }
  if (detalleProyectoActions) {
    detalleProyectoActions.style.display = 'none';
  }

  setBadge(dto.estadoSolicitud);

  const lines = [];
  lines.push(`Solicitud #${dto.idSolicitud} • ${dto.fechaSolicitud ?? ''}`);
  lines.push(`Enviada por: ${dto.quienEnvia ?? '—'}`);

  if ((dto.estadoSolicitud || '').toUpperCase() === 'APROBADA' && dto.supervisorAsignado) {
    lines.push(`Supervisor asignado: ${dto.supervisorAsignado}`);
  }
  if ((dto.estadoSolicitud || '').toUpperCase() === 'RECHAZADA' && dto.motivoRechazo) {
    lines.push(`Motivo: ${dto.motivoRechazo}`);
  }

  if (detalleMeta) detalleMeta.innerHTML = lines.map(x => `<div>${x}</div>`).join('');
  if (detalleBody) detalleBody.innerHTML = renderDetalleForm(dto);
}

export function renderDetalleProyecto(dto) {
  const detalleActions = document.getElementById('detalleActions');
  const detalleProyectoActions = document.getElementById('detalleProyectoActions');
  const detalleMeta = document.getElementById('detalleMeta');
  const detalleBody = document.getElementById('detalleBody');

  if (detalleActions) detalleActions.style.display = 'none';
  if (detalleProyectoActions) detalleProyectoActions.style.display = 'flex';

  setBadge(dto.estadoProyecto);

  const lines = [];
  lines.push(`Proyecto #${dto.idProyecto} • Solicitud #${dto.idSolicitud}`);
  lines.push(`Fecha de aprobación: ${dto.fechaAprobacion ?? ''}`);
  lines.push(`Constructor: ${dto.quienEnvia ?? '—'}`);
  lines.push(`Supervisor asignado: ${dto.supervisorAsignado ?? '—'}`);

  if (detalleMeta) detalleMeta.innerHTML = lines.map(x => `<div>${x}</div>`).join('');
  if (detalleBody) detalleBody.innerHTML = renderDetalleForm(dto);
}

export function openUserModal() {
  openModal(
    document.getElementById('userModal'),
    document.getElementById('userModalBackdrop')
  );
}

export function closeUserModal() {
  closeModal(
    document.getElementById('userModal'),
    document.getElementById('userModalBackdrop')
  );
}

export function setUserModalMode(mode) {
  const title = document.getElementById('userModalTitle');
  const btnSave = document.getElementById('btnGuardarUsuario');
  const btnDelete = document.getElementById('btnEliminarUsuario');

  if (mode === 'CREATE') {
    if (title) title.textContent = 'Agregar usuario';
    if (btnSave) btnSave.textContent = 'Crear usuario';
    if (btnDelete) btnDelete.style.display = 'none';
  } else {
    if (title) title.textContent = 'Detalle de usuario';
    if (btnSave) btnSave.textContent = 'Guardar cambios';
    if (btnDelete) btnDelete.style.display = 'inline-flex';
  }
}

// --- Menú desplegable de la foto de perfil ---
export function closeProfileMenu() {
    document.getElementById('profileMenuDropdown')?.classList.remove('open');
}

export function toggleProfileMenu() {
    document.getElementById('profileMenuDropdown')?.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileMenuDropdown');
    if (dropdown?.classList.contains('open') && !e.target.closest('.userbox')) {
        closeProfileMenu();
    }
});

export function renderDocumentacionInicialSolicitud(data) {
  const detalleBody = document.getElementById('detalleBody');
  if (!detalleBody) return;

  document.getElementById('docInicialSolicitudBox')?.remove();

  const documentos = Array.isArray(data?.documentos) ? data.documentos : [];

  const html = `
    <div class="doc-solicitud-box" id="docInicialSolicitudBox">
      <h3>Documentación inicial</h3>

      <div class="doc-solicitud-alert ${data?.completo ? 'ok' : 'warn'}">
        ${escapeHtml(data?.mensaje || 'Faltan documentos iniciales por subir.')}
      </div>

      <div class="doc-solicitud-list">
        ${documentos.map(doc => `
          <div class="doc-solicitud-item">
            <div class="doc-solicitud-info">
              <strong>${escapeHtml(doc.nombreDocumento || '')}</strong>
              <span>${doc.subido ? 'Subido' : 'Pendiente'}</span>
              <small>Fecha límite: ${escapeHtml(doc.fechaLimite || '—')}</small>
            </div>

            <div class="doc-solicitud-action">
              ${
                doc.subido && doc.archivoUrl
                  ? `<a class="doc-solicitud-link" href="${doc.archivoUrl}" target="_blank">
                      <span class="doc-solicitud-check">✓</span>
                      <span>${escapeHtml(doc.nombreArchivoOriginal || 'Ver PDF')}</span>
                    </a>`
                  : `<span class="doc-solicitud-pending">Sin archivo</span>`
              }
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  detalleBody.insertAdjacentHTML('beforeend', html);
}