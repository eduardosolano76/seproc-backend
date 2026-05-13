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
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

export async function uploadProfilePhoto(file) {
  const { token, header } = getCsrf();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/direccion/perfil/foto', {
    method: 'POST',
    body: form,
    headers: token && header ? { [header]: token } : {}
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data?.message || text || 'No se pudo subir la foto.');
  return data.url;
}

export async function deleteProfilePhoto() {
  const headers = buildHeaders();
  const res = await fetch('/direccion/perfil/foto', { method: 'DELETE', headers });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar la foto.');
  return data;
}

export async function fetchProyectos(estado) {
  return await fetchJson(`/api/direccion/proyectos?estado=${encodeURIComponent(estado)}`);
}

export async function fetchDetalleProyecto(id) {
  return await fetchJson(`/api/direccion/proyectos/${id}`);
}

export async function fetchDetalleEtapaProyecto(idProyecto, etapa) {
  return await fetchJson(`/api/direccion/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`);
}

export async function fetchHistorialEtapaProyecto(idProyecto, etapa) {
  return await fetchJson(`/api/direccion/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`);
}

export async function changePassword(payload) {
  await fetchText('/direccion/perfil/password', {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
}

export async function fetchDocumentacionInicialProyecto(idProyecto) {
  return await fetchJson(`/api/direccion/proyectos/${idProyecto}/documentacion-inicial`, {
    cache: 'no-store'
  });
}
