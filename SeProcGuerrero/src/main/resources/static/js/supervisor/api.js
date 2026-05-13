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

async function fetchJson(url, options = {}) {
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

export async function fetchProyectos(estado) {
  return await fetchJson(`/api/supervisor/proyectos?estado=${encodeURIComponent(estado)}`);
}

export async function fetchDetalleProyecto(id) {
  return await fetchJson(`/api/supervisor/proyectos/${id}`);
}

export async function uploadProfilePhoto(file) {
  const { token, header } = getCsrf();

  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/supervisor/perfil/foto', {
    method: 'POST',
    body: form,
    headers: token && header ? { [header]: token } : {}
  });

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || text || 'No se pudo subir la foto.');
  }

  return data.url;
}

export async function changePassword(payload) {
  await fetchText('/supervisor/perfil/password', {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
}

export async function deleteProfilePhoto() {
  const headers = buildHeaders();
  const res = await fetch('/supervisor/perfil/foto', {
    method: 'DELETE',
    headers
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }

  if (!res.ok) {
    throw new Error(data?.message || "No se pudo eliminar la foto.");
  }

  return data;
}

export async function fetchDetalleEtapa(idProyecto, etapa) {
  const res = await fetch(`/api/supervisor/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`);
  if (!res.ok) throw new Error(await res.text() || 'No se pudo cargar el detalle de la etapa');
  return await res.json();
}

export async function fetchHistorialEtapa(idProyecto, etapa) {
  const res = await fetch(`/api/supervisor/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`);
  if (!res.ok) throw new Error(await res.text() || 'No se pudo cargar el historial de la etapa');
  return await res.json();
}

export async function observarEtapa(idProyecto, etapa, comentario) {
  const params = new URLSearchParams();
  params.append('comentario', comentario);

  const res = await fetch(`/api/supervisor/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/observar`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    body: params.toString()
  });

  if (!res.ok) throw new Error(await res.text() || 'No se pudo guardar la observación');
  return await res.text();
}

export async function aprobarEtapa(idProyecto, etapa) {
  const res = await fetch(`/api/supervisor/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/aprobar`, {
    method: 'POST',
    headers: buildHeaders()
  });

  if (!res.ok) throw new Error(await res.text() || 'No se pudo aprobar la etapa');
  return await res.text();
}

export async function fetchDocumentacionInicialProyecto(idProyecto) {
  const res = await fetch(`/api/supervisor/proyectos/${idProyecto}/documentacion-inicial`, {
    cache: 'no-store'
  });

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