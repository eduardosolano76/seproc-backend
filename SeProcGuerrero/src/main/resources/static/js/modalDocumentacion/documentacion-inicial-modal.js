function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cerrarModalDocumentacionInicial() {
  document.getElementById('docInicialModalBackdrop')?.remove();
}

function nombreArchivoVisible(doc) {
  return doc.nombreArchivoOriginal || doc.nombreArchivo || 'Documento.pdf';
}

function abrirModalMotivoCorreccion(doc, onCorreccion) {
  document.getElementById('docCorreccionModalBackdrop')?.remove();

  const modal = document.createElement('div');
  modal.className = 'doc-correccion-backdrop';
  modal.id = 'docCorreccionModalBackdrop';

  modal.innerHTML = `
    <div class="doc-correccion-card">
      <button class="doc-correccion-close" type="button" id="btnCloseCorreccionDoc">×</button>

      <h3>Solicitar corrección</h3>

      <p>
        Escribe el motivo por el que el constructor debe volver a subir:
        <strong>${escapeHtml(doc.nombreDocumento || 'documento')}</strong>
      </p>

      <textarea
        id="txtMotivoCorreccionDoc"
        class="doc-correccion-textarea"
        maxlength="500"
        placeholder="Ejemplo: El archivo no corresponde al documento solicitado."
      ></textarea>

      <button class="doc-correccion-submit" type="button" id="btnEnviarCorreccionDoc">
        Enviar solicitud
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const cerrar = () => modal.remove();

  document.getElementById('btnCloseCorreccionDoc')?.addEventListener('click', cerrar);

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) cerrar();
  });

  document.getElementById('btnEnviarCorreccionDoc')?.addEventListener('click', async () => {
    const motivo = document.getElementById('txtMotivoCorreccionDoc')?.value?.trim();
    const btnEnviar = document.getElementById('btnEnviarCorreccionDoc');

    if (!motivo) {
      alert('Escribe el motivo de la corrección.');
      return;
    }

    if (typeof onCorreccion !== 'function') {
      alert('No se configuró la acción para solicitar corrección.');
      return;
    }

    try {
      if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';
      }

      const idDocumento = doc.idDocumento;

      cerrar();
      cerrarModalDocumentacionInicial();

      await onCorreccion(idDocumento, motivo);
    } catch (e) {
      alert('No se pudo solicitar la corrección: ' + e.message);

      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar solicitud';
      }
    }
  });
}

export function abrirModalDocumentacionInicial(data, options = {}) {
  const puedeSubir = options.puedeSubir === true;
  const puedeSolicitarCorreccion = options.puedeSolicitarCorreccion === true;
  const puedeAprobar = options.puedeAprobar === true;

  const onUpload = options.onUpload;
  const onCorreccion = options.onCorreccion;
  const onAprobar = options.onAprobar;

  cerrarModalDocumentacionInicial();

  const documentos = Array.isArray(data?.documentos) ? data.documentos : [];
  const selectedFiles = new Map();
  const selectedFileUrls = new Map();

  function getEstadoTexto(doc) {
    const subido = doc.subido === true;
    const requiereCorreccion = doc.requiereCorreccion === true;
    const aprobado = doc.aprobado === true;
    const tieneArchivo = doc.tieneArchivo === true || !!doc.archivoUrl;
    const vencido = doc.vencido === true;

    let estadoTexto = 'Pendiente';

    if (aprobado) {
      estadoTexto = 'Documento aprobado';
    } else if (requiereCorreccion) {
      estadoTexto = 'Corrección pendiente';
    } else if (subido || tieneArchivo) {
      estadoTexto = 'Subido';
    }

    if (vencido) {
      estadoTexto += ' · Vencido';
    }

    return estadoTexto;
  }

  function buildArchivoLink(doc) {
    if (!doc.archivoUrl) return '';

    const nombre = nombreArchivoVisible(doc);

    return `
      <a
        class="doc-file-link-current"
        href="${escapeHtml(doc.archivoUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        title="${escapeHtml(nombre)}">
        ${escapeHtml(nombre)}
      </a>
    `;
  }

  function buildUploadIcon(doc) {
    const inputId = `doc-upload-${doc.idDocumento}`;

    return `
      <div class="doc-upload-top">
        <label class="doc-upload-icon-only" for="${inputId}" title="Seleccionar PDF">
          <img src="/assets/iconos/subir-archivo.png" alt="Seleccionar PDF">
        </label>

        <input
          id="${inputId}"
          class="doc-hidden-upload-input"
          type="file"
          accept="application/pdf,.pdf"
          data-doc-upload-input="${escapeHtml(doc.idDocumento)}">
      </div>
    `;
  }

  function buildSelectedFileUi(doc) {
    const docId = String(doc.idDocumento);
    const selectedFile = selectedFiles.get(docId);
    const selectedUrl = selectedFileUrls.get(docId);

    if (!selectedFile) return '';

    return `
      <div class="doc-upload-block">
        <div class="doc-selected-file-wrap">
          <a
            class="doc-selected-file-name"
            href="${escapeHtml(selectedUrl || '#')}"
            target="_blank"
            rel="noopener noreferrer"
            title="${escapeHtml(selectedFile.name)}">
            ${escapeHtml(selectedFile.name)}
          </a>

          <button
            class="doc-remove-selected-file"
            type="button"
            title="Quitar archivo"
            data-doc-remove-file="${escapeHtml(doc.idDocumento)}">
            ×
          </button>
        </div>

        <button
          class="doc-upload-submit"
          type="button"
          data-doc-upload-submit="${escapeHtml(doc.idDocumento)}"
          data-doc-upload-tipo="${escapeHtml(doc.tipoDocumento)}">
          Subir evidencia
        </button>
      </div>
    `;
  }

  function buildConstructorActions(doc) {
    const aprobado = doc.aprobado === true;
    const requiereCorreccion = doc.requiereCorreccion === true;
    const tieneArchivo = doc.tieneArchivo === true || !!doc.archivoUrl;
    const selectedFile = selectedFiles.get(String(doc.idDocumento));

    if (selectedFile) {
      return buildSelectedFileUi(doc);
    }

    return `
      <div class="doc-upload-block">
        ${tieneArchivo ? buildArchivoLink(doc) : ''}

        ${
          !aprobado && (!tieneArchivo || requiereCorreccion)
            ? buildUploadIcon(doc)
            : ''
        }
      </div>
    `;
  }

  function buildRevisionActions(doc) {
    const aprobado = doc.aprobado === true;
    const requiereCorreccion = doc.requiereCorreccion === true;
    const tieneArchivo = doc.tieneArchivo === true || !!doc.archivoUrl;

    if (!tieneArchivo) {
      return `<span class="doc-evidencia-pendiente">Pendiente</span>`;
    }

    return `
      ${buildArchivoLink(doc)}

	  ${
	    puedeAprobar && !aprobado && !requiereCorreccion
	      ? `
	        <button
	          class="doc-btn-aprobar"
	          type="button"
	          data-doc-aprobar="${escapeHtml(doc.idDocumento)}">
	          Aprobar documento
	        </button>
	      `
	      : ''
	  }

      ${
        puedeSolicitarCorreccion && !aprobado && !requiereCorreccion
          ? `
            <button
              class="doc-btn-correccion"
              type="button"
              data-doc-correccion="${escapeHtml(doc.idDocumento)}">
              Solicitar corrección
            </button>
          `
          : ''
      }

      ${
        requiereCorreccion
          ? `<span class="doc-correccion-status">Corrección pendiente</span>`
          : ''
      }
    `;
  }

  function buildRow(doc) {
    const subido = doc.subido === true;
    const requiereCorreccion = doc.requiereCorreccion === true;
    const aprobado = doc.aprobado === true;

    const accionPrincipalHtml = puedeSubir
      ? buildConstructorActions(doc)
      : buildRevisionActions(doc);

    const motivoHtml = requiereCorreccion && doc.motivoCorreccion
      ? `
        <div class="doc-motivo-correccion">
          <strong>Motivo de corrección:</strong>
          <span>${escapeHtml(doc.motivoCorreccion)}</span>
        </div>
      `
      : '';

	  return `
	    <div class="doc-inicial-row ${subido ? 'is-uploaded' : 'is-pending'} ${requiereCorreccion ? 'is-correction' : ''} ${aprobado ? 'is-approved' : ''}">
	      <div class="doc-inicial-info">
	        <strong>${escapeHtml(doc.nombreDocumento || '')}</strong>
	        <span>${escapeHtml(getEstadoTexto(doc))}</span>

	        ${
	          aprobado && doc.fechaSubida
	            ? `<small>Fecha de subida: ${escapeHtml(doc.fechaSubida)}</small>`
	            : doc.fechaLimite
	              ? `<small>Fecha límite: ${escapeHtml(doc.fechaLimite)}</small>`
	              : ''
	        }

	        ${motivoHtml}
	      </div>

	      <div class="doc-inicial-actions">
	        ${accionPrincipalHtml}
	      </div>
	    </div>
	  `;
	  }

  function renderRows() {
    const list = document.getElementById('docInicialList');
    if (!list) return;

    list.innerHTML = documentos.map(buildRow).join('');
    bindRowEvents();
  }

  async function handleUpload(docId, tipoDocumento) {
    const selectedFile = selectedFiles.get(String(docId));

    if (!selectedFile) {
      alert('Selecciona un archivo PDF antes de subirlo.');
      return;
    }

    if (typeof onUpload !== 'function') {
      alert('No se configuró la acción para subir el archivo.');
      return;
    }

    const btn = document.querySelector(`[data-doc-upload-submit="${docId}"]`);

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Subiendo...';
      }

      cerrarModalDocumentacionInicial();

      await onUpload(tipoDocumento, selectedFile);

      selectedFiles.delete(String(docId));

      const oldUrl = selectedFileUrls.get(String(docId));
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      selectedFileUrls.delete(String(docId));
    } catch (e) {
      alert('No se pudo subir el archivo: ' + e.message);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Subir evidencia';
      }
    }
  }

  function bindRowEvents() {
    document.querySelectorAll('[data-doc-upload-input]').forEach(input => {
      input.addEventListener('change', (ev) => {
        const docId = ev.currentTarget.dataset.docUploadInput;
        const file = ev.currentTarget.files?.[0];

        if (!docId) return;

        const oldUrl = selectedFileUrls.get(String(docId));
        if (oldUrl) URL.revokeObjectURL(oldUrl);

        if (!file) {
          selectedFiles.delete(String(docId));
          selectedFileUrls.delete(String(docId));
          renderRows();
          return;
        }

        selectedFiles.set(String(docId), file);
        selectedFileUrls.set(String(docId), URL.createObjectURL(file));

        renderRows();
      });
    });

    document.querySelectorAll('[data-doc-remove-file]').forEach(btn => {
      btn.addEventListener('click', () => {
        const docId = btn.dataset.docRemoveFile;
        if (!docId) return;

        const oldUrl = selectedFileUrls.get(String(docId));
        if (oldUrl) URL.revokeObjectURL(oldUrl);

        selectedFiles.delete(String(docId));
        selectedFileUrls.delete(String(docId));

        renderRows();
      });
    });

    document.querySelectorAll('[data-doc-upload-submit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.dataset.docUploadSubmit;
        const tipoDocumento = btn.dataset.docUploadTipo;

        if (!docId || !tipoDocumento) return;

        await handleUpload(docId, tipoDocumento);
      });
    });

    document.querySelectorAll('[data-doc-correccion]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idDocumento = Number(btn.dataset.docCorreccion);
        const doc = documentos.find(item => Number(item.idDocumento) === idDocumento);

        if (!doc) return;

        abrirModalMotivoCorreccion(doc, onCorreccion);
      });
    });

    document.querySelectorAll('[data-doc-aprobar]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idDocumento = Number(btn.dataset.docAprobar);

        if (!idDocumento || typeof onAprobar !== 'function') return;

        cerrarModalDocumentacionInicial();

        await onAprobar(idDocumento);
      });
    });
  }

  const modal = document.createElement('div');
  modal.className = 'doc-modal-backdrop';
  modal.id = 'docInicialModalBackdrop';

  modal.innerHTML = `
    <div class="doc-modal-card" role="dialog" aria-modal="true">
      <button class="doc-modal-close" type="button" id="btnCloseDocInicial" aria-label="Cerrar">
        ×
      </button>

      <h3 class="doc-modal-title">Documentación inicial</h3>

      ${
        data?.completo
          ? `<div class="doc-alert doc-alert-ok">Documentación inicial completa.</div>`
          : `<div class="doc-alert doc-alert-warning">
              ${escapeHtml(data?.mensaje || 'Faltan documentos iniciales por subir.')}
            </div>`
      }

      <div class="doc-inicial-list" id="docInicialList"></div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCloseDocInicial')?.addEventListener('click', () => {
    selectedFileUrls.forEach(url => URL.revokeObjectURL(url));
    cerrarModalDocumentacionInicial();
  });

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) {
      selectedFileUrls.forEach(url => URL.revokeObjectURL(url));
      cerrarModalDocumentacionInicial();
    }
  });

  renderRows();
}