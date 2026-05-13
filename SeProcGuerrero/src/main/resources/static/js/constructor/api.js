// api.js

export function getCsrf() {
  const token = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
  const header = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
  return { token, header };
}

export function buildHeaders(extra = {}) {
  const { token, header } = getCsrf();
  const headers = new Headers(extra);
  if (token && header) headers.set(header, token);
  return headers;
}

export async function fetchText(url, options = {}) {
  const headers = buildHeaders({ 'Content-Type': 'application/json', ...(options.headers || {}) });
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

export async function fetchHtml(url) {
  const res = await fetch(url, {
      cache: "no-store",
      headers: { "X-Requested-With": "XMLHttpRequest" }
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

export async function uploadProfilePhoto(file) {
  const { token, header } = getCsrf();
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/constructor/perfil/foto", {
    method: "POST",
    body: form,
    headers: token && header ? { [header]: token } : {}
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
  
  if (!res.ok) throw new Error(data?.message || text || "No se pudo subir la foto.");
  return data.url;
}

export async function fetchProyectos(estado) {
  const res = await fetch(`/api/constructor/proyectos?estado=${encodeURIComponent(estado)}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchDetalleProyecto(id) {
  const res = await fetch(`/api/constructor/proyectos/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchEstados() {
  const res = await fetch('/api/geo/estados');
  return await res.json();
}

export async function fetchMunicipios(estadoId) {
  const res = await fetch(`/api/geo/municipios?estadoId=${encodeURIComponent(estadoId)}`);
  return await res.json();
}

export async function fetchLocalidades(municipioId) {
  const res = await fetch(`/api/geo/localidades?municipioId=${encodeURIComponent(municipioId)}`);
  return await res.json();
}

export async function postSolicitud(payload) {
  const headers = buildHeaders({ 'Content-Type': 'application/json' });

  const res = await fetch('/api/constructor/solicitudes', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || text || 'Error al guardar');
  }

  return data;
}

export async function uploadDocumentoInicialSolicitud(idSolicitud, tipoDocumento, file) {
  const { token, header } = getCsrf();

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/constructor/solicitudes/${idSolicitud}/documentos/${tipoDocumento}`, {
    method: 'POST',
    body: form,
    headers: token && header ? { [header]: token } : {}
  });

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || text || 'No se pudo subir el documento.');
  }

  return data;
}

export async function fetchDocumentacionInicialProyecto(idProyecto) {
  const res = await fetch(`/api/constructor/proyectos/${idProyecto}/documentacion-inicial`);

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || text || 'No se pudo cargar la documentación inicial.');
  }

  return data;
}

export async function deleteProfilePhoto() {
  const headers = buildHeaders();
  const res = await fetch('/constructor/perfil/foto', { 
    method: 'DELETE', 
    headers 
  });
  
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
  
  if (!res.ok) throw new Error(data?.message || "No se pudo eliminar la foto.");
  return data;
}

export async function fetchTiposEdificacion() {
  const res = await fetch('/api/catalogos/tipos-edificacion');
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function uploadReportPdf(idProyecto, etapa, file) {
  const { token, header } = getCsrf();
  const form = new FormData();
  form.append("file", file);
  uploadReportPdf

  const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${etapa}/reporte`, {
    method: "POST",
    body: form,
    headers: token && header ? { [header]: token } : {}
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { data = {}; }

  if (!res.ok) throw new Error(data.message || text || "No se pudo subir el reporte.");
  return data;
}

export async function updateReportNote(idProyecto, etapa, storagePath, nota) {
    const { token, header } = getCsrf();
    const form = new FormData();
    form.append("storagePath", storagePath);
    form.append("nota", nota);

    const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${etapa}/archivo/nota`, {
        method: "POST",
        body: form,
        headers: token && header ? { [header]: token } : {}
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) { data = {}; }

    if (!res.ok) throw new Error(data.message || text || "No se pudo actualizar la nota.");
    return data;
}

export async function fetchDetalleEtapa(idProyecto, etapa) {
    const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`);
    if (!res.ok) throw new Error(await res.text() || 'No se pudo cargar el detalle de la etapa');
    return await res.json();
}

export async function fetchHistorialEtapa(idProyecto, etapa) {
    const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`);
    if (!res.ok) throw new Error(await res.text() || 'No se pudo cargar el historial de la etapa');
    return await res.json();
}

export async function entregarReportePdf(idProyecto, etapa) {
  const { token, header } = getCsrf();
  const headers = token && header ? { [header]: token } : {};

  const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${etapa}/entregar`, {
    method: "POST",
    headers: headers
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { data = {}; }

  if (!res.ok) throw new Error(data.message || text || "No se pudo entregar el reporte.");
  return data;
}

export async function deleteReportImage(idProyecto, etapa, storagePath) {
    const { token, header } = getCsrf();
    const headers = token && header ? { [header]: token } : {};

    const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${etapa}/archivo?storagePath=${encodeURIComponent(storagePath)}`, {
        method: "DELETE",
        headers: headers
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) { data = {}; }

    if (!res.ok) throw new Error(data.message || text || "No se pudo eliminar la imagen.");
    return data;
}

export async function downloadReportPdf(idProyecto, etapa) {
    const res = await fetch(`/api/constructor/proyectos/${idProyecto}/etapas/${etapa}/pdf`);
    
    if (!res.ok) throw new Error("No se pudo generar el PDF");
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Reporte_${etapa}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}