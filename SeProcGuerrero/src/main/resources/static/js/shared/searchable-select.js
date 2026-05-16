//Para que se vayan filtrando los select del formulario por letras

function normalizarTexto(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function crearSearchableSelect(select) {
  if (!select || select.dataset.searchableReady === 'true') return;

  select.dataset.searchableReady = 'true';
  select.classList.add('dg-select-native-hidden');

  const wrapper = document.createElement('div');
  wrapper.className = 'dg-search-select';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dg-search-trigger';

  const label = document.createElement('span');
  label.className = 'dg-search-label';

  const arrow = document.createElement('span');
  arrow.className = 'dg-search-arrow';
  arrow.textContent = '⌄';

  trigger.appendChild(label);
  trigger.appendChild(arrow);

  const menu = document.createElement('div');
  menu.className = 'dg-search-menu';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dg-search-input';
  input.placeholder = 'Buscar...';
  input.autocomplete = 'off';

  const list = document.createElement('div');
  list.className = 'dg-search-list';

  menu.appendChild(input);
  menu.appendChild(list);

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  select.insertAdjacentElement('afterend', wrapper);

  function obtenerOpciones() {
    return Array.from(select.options).filter(option => {
      return option.value !== '' && !option.disabled;
    });
  }

  function obtenerPlaceholder() {
    const emptyOption = Array.from(select.options).find(option => option.value === '');
    return emptyOption?.textContent?.trim() || 'Seleccionar';
  }

  function actualizarLabel() {
    const selected = select.options[select.selectedIndex];

    if (selected && selected.value !== '') {
      label.textContent = selected.textContent;
      label.classList.remove('is-placeholder');
    } else {
      label.textContent = obtenerPlaceholder();
      label.classList.add('is-placeholder');
    }
  }

  function renderOpciones(filtro = '') {
    const filtroNormalizado = normalizarTexto(filtro);
    const opciones = obtenerOpciones();

    const filtradas = opciones.filter(option => {
      const texto = normalizarTexto(option.textContent);
      return texto.includes(filtroNormalizado);
    });

    if (filtradas.length === 0) {
      list.innerHTML = `
        <div class="dg-search-empty">
          Sin resultados
        </div>
      `;
      return;
    }

    list.innerHTML = filtradas.map(option => {
      const active = option.value === select.value ? ' active' : '';

      return `
        <button
          type="button"
          class="dg-search-option${active}"
          data-value="${option.value.replaceAll('"', '&quot;')}">
          ${option.textContent}
        </button>
      `;
    }).join('');

    list.querySelectorAll('.dg-search-option').forEach(button => {
      button.addEventListener('click', () => {
        select.value = button.dataset.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));

        actualizarLabel();
        cerrarMenu();
      });
    });
  }

  function abrirMenu() {
    document.querySelectorAll('.dg-search-select.open').forEach(item => {
      if (item !== wrapper) item.classList.remove('open');
    });

    wrapper.classList.add('open');
    input.value = '';
    renderOpciones('');
    setTimeout(() => input.focus(), 0);
  }

  function cerrarMenu() {
    wrapper.classList.remove('open');
  }

  trigger.addEventListener('click', () => {
    if (wrapper.classList.contains('open')) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  });

  trigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      abrirMenu();
    }

    if (event.key === 'Escape') {
      cerrarMenu();
    }
  });

  input.addEventListener('input', () => {
    renderOpciones(input.value);
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      cerrarMenu();
      trigger.focus();
    }
  });

  select.addEventListener('change', actualizarLabel);

  const observer = new MutationObserver(() => {
    actualizarLabel();
    if (wrapper.classList.contains('open')) {
      renderOpciones(input.value);
    }
  });

  observer.observe(select, {
    childList: true,
    subtree: true,
    attributes: true
  });

  actualizarLabel();
}

function cerrarSelectsAlClickFuera(event) {
  document.querySelectorAll('.dg-search-select.open').forEach(wrapper => {
    if (!wrapper.contains(event.target)) {
      wrapper.classList.remove('open');
    }
  });
}

export function inicializarSearchableSelects(root = document) {
  root.querySelectorAll('select[data-searchable-select]').forEach(crearSearchableSelect);
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarSearchableSelects();
  document.addEventListener('click', cerrarSelectsAlClickFuera);
});

window.inicializarSearchableSelects = inicializarSearchableSelects;