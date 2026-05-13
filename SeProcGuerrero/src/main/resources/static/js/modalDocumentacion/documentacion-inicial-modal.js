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

export function abrirModalDocumentacionInicial(data, options = {}) {
  const puedeSubir = options.puedeSubir === true;
  const onUpload = options.onUpload;

  cerrarModalDocumentacionInicial();

  const documentos = Array.isArray(data?.documentos) ? data.documentos : [];

  const documentosHtml = documentos.map(doc => {
    const subido = doc.subido === true;
    const vencido = doc.vencido === true;

    let accionHtml = '';

    if (subido && doc.archivoUrl) {
      accionHtml = `
        <a
          class="doc-evidencia-link"
          href="${escapeHtml(doc.archivoUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir evidencia">
          Evidencia
        </a>
      `;
    } else if (puedeSubir) {
      accionHtml = `
        <label class="doc-upload-icon-only" title="Subir PDF">
          <img src="/assets/iconos/subir-archivo.png" alt="Subir PDF">

          <input
            type="file"
            accept="application/pdf,.pdf"
            data-doc-upload="${escapeHtml(doc.tipoDocumento)}"
          >
        </label>
      `;
    } else {
      accionHtml = `
        <span class="doc-evidencia-pendiente">Pendiente</span>
      `;
    }

    return `
      <div class="doc-inicial-row ${subido ? 'is-uploaded' : 'is-pending'} ${vencido ? 'is-expired' : ''}">
        <div class="doc-inicial-info">
          <strong>${escapeHtml(doc.nombreDocumento || '')}</strong>
          <span>${subido ? 'Subido' : 'Pendiente'}${vencido ? ' · Vencido' : ''}</span>
          ${doc.fechaLimite ? `<small>Fecha límite: ${escapeHtml(doc.fechaLimite)}</small>` : ''}
        </div>

        <div class="doc-inicial-actions">
          ${accionHtml}
        </div>
      </div>
    `;
  }).join('');

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

      <div class="doc-inicial-list">
        ${documentosHtml}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCloseDocInicial')?.addEventListener('click', cerrarModalDocumentacionInicial);

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) {
      cerrarModalDocumentacionInicial();
    }
  });

  modal.querySelectorAll('input[data-doc-upload]').forEach(input => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      const tipoDocumento = input.dataset.docUpload;

      if (!file || !tipoDocumento || typeof onUpload !== 'function') {
        return;
      }

      try {
        input.disabled = true;
        await onUpload(tipoDocumento, file);
      } finally {
        input.disabled = false;
      }
    });
  });
}