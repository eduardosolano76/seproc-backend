//admin/api.js
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

async function fetchText(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return text;
}

export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/* foto perfil */
export async function uploadProfilePhoto(file) {
  const { token, header } = getCsrf();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/admin/perfil/foto', {
    method: 'POST',
    body: form,
    headers: token && header ? { [header]: token } : {}
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

  if (!res.ok) {
    throw new Error(data?.message || text || 'No se pudo subir la foto.');
  }

  return data.url;
}

export async function fetchSolicitudes(estado) {
  return await fetchJson(`/api/admin/solicitudes?estado=${encodeURIComponent(estado)}`);
}

export async function fetchDetalleSolicitud(id) {
  return await fetchJson(`/api/admin/solicitudes/${id}`);
}

export async function fetchSupervisores() {
  return await fetchJson('/api/admin/solicitudes/supervisores');
}

export async function postAprobar(idSolicitud, supervisorId) {
  const url = `/api/admin/solicitudes/${idSolicitud}/aprobar?supervisorId=${encodeURIComponent(supervisorId)}`;
  await fetchText(url, {
    method: 'POST',
    headers: buildHeaders()
  });
}

export async function postRechazar(idSolicitud, motivo) {
  const url = `/api/admin/solicitudes/${idSolicitud}/rechazar?motivo=${encodeURIComponent(motivo)}`;
  await fetchText(url, {
    method: 'POST',
    headers: buildHeaders()
  });
}

export async function fetchProyectos(estado) {
  return await fetchJson(`/api/admin/proyectos?estado=${encodeURIComponent(estado)}`);
}

export async function fetchDetalleProyecto(id) {
  return await fetchJson(`/api/admin/proyectos/${id}`);
}

export async function fetchDetalleEtapaProyecto(idProyecto, etapa) {
  return await fetchJson(`/api/admin/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`);
}

export async function fetchHistorialEtapaProyecto(idProyecto, etapa) {
  return await fetchJson(`/api/admin/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`);
}

export async function cambiarEstadoProyecto(id, estado) {
  await fetchText(`/api/admin/proyectos/${id}/estado?estado=${encodeURIComponent(estado)}`, {
    method: 'POST',
    headers: buildHeaders()
  });
}

export async function fetchUserDetail(id) {
  return await fetchJson(`admin/usuarios/${id}`, { cache: 'no-store' });
}

export async function createUser(payload) {
  await fetchText('admin/usuarios/crear', {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
}

export async function updateUser(id, payload) {
  await fetchText(`admin/usuarios/${id}/actualizar`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
}

export async function deleteUser(id) {
  await fetchText(`admin/usuarios/${id}/eliminar`, {
    method: 'POST',
    headers: buildHeaders()
  });
}

export async function changePassword(payload) {
  await fetchText('/admin/perfil/password', {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
}

export async function deleteProfilePhoto() {
  const headers = buildHeaders();
  const res = await fetch('/admin/perfil/foto', {
    method: 'DELETE',
    headers
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo eliminar la foto.');
  }

  return data;
}

export async function fetchDocumentacionInicialProyecto(idProyecto) {
  return await fetchJson(`/api/admin/proyectos/${idProyecto}/documentacion-inicial`);
}

export async function fetchDocumentacionInicialSolicitud(idSolicitud) {
  return await fetchJson(`/api/admin/solicitudes/${idSolicitud}/documentacion-inicial`, {
    cache: 'no-store'
  });
}

//Para la correción de la documentación por si está mal
export async function solicitarCorreccionDocumentoInicial(idDocumento, motivo) {
  const res = await fetch(`/api/admin/documentos-iniciales/${idDocumento}/solicitar-correccion`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ motivo })
  });

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || text || 'No se pudo solicitar la corrección.');
  }

  return data;
}

//Para aprobar documento
export async function aprobarDocumentoInicial(idDocumento) {
  const res = await fetch(`/api/admin/documentos-iniciales/${idDocumento}/aprobar`, {
    method: 'POST',
    headers: buildHeaders()
  });

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || text || 'No se pudo aprobar el documento.');
  }

  return data;
}