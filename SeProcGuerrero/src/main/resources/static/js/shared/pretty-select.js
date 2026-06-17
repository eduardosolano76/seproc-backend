function crearPrettySelect(select) {
  if (!select || select.dataset.prettyReady === 'true') return;

  select.dataset.prettyReady = 'true';
  select.classList.add('pretty-select-hidden');

  const wrapper = document.createElement('div');
  wrapper.className = 'pretty-select';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'pretty-select-trigger';

  const label = document.createElement('span');
  label.className = 'pretty-select-label';

  const arrow = document.createElement('span');
  arrow.className = 'pretty-select-arrow';
  arrow.textContent = '⌄';

  trigger.appendChild(label);
  trigger.appendChild(arrow);

  const menu = document.createElement('div');
  menu.className = 'pretty-select-menu';

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  select.insertAdjacentElement('afterend', wrapper);

  function getPlaceholder() {
    const empty = Array.from(select.options).find(opt => opt.value === '');
    return empty?.textContent?.trim() || 'Seleccionar';
  }

  function updateLabel() {
    const selected = select.options[select.selectedIndex];

    if (selected && selected.value !== '') {
      label.textContent = selected.textContent;
      label.classList.remove('is-placeholder');
    } else {
      label.textContent = getPlaceholder();
      label.classList.add('is-placeholder');
    }
  }

  function renderOptions() {
    const options = Array.from(select.options).filter(opt => opt.value !== '' && !opt.disabled);

    if (options.length === 0) {
      menu.innerHTML = `<div class="pretty-select-empty">Sin opciones</div>`;
      return;
    }

    menu.innerHTML = options.map(opt => {
      const active = opt.value === select.value ? ' active' : '';
      return `
        <button
          type="button"
          class="pretty-select-option${active}"
          data-value="${String(opt.value).replaceAll('"', '&quot;')}">
          ${opt.textContent}
        </button>
      `;
    }).join('');

    menu.querySelectorAll('.pretty-select-option').forEach(btn => {
      btn.addEventListener('click', () => {
        select.value = btn.dataset.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        updateLabel();
        wrapper.classList.remove('open');
      });
    });
  }

  trigger.addEventListener('click', event => {
    event.stopPropagation();

    document.querySelectorAll('.pretty-select.open').forEach(item => {
      if (item !== wrapper) item.classList.remove('open');
    });

    renderOptions();
    wrapper.classList.toggle('open');
  });

  select.addEventListener('change', updateLabel);

  const observer = new MutationObserver(() => {
    updateLabel();
    if (wrapper.classList.contains('open')) renderOptions();
  });

  observer.observe(select, {
    childList: true,
    subtree: true,
    attributes: true
  });

  updateLabel();
}

export function inicializarPrettySelects(root = document) {
  root.querySelectorAll('select[data-pretty-select]').forEach(crearPrettySelect);
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarPrettySelects();

  document.addEventListener('click', event => {
    document.querySelectorAll('.pretty-select.open').forEach(wrapper => {
      if (!wrapper.contains(event.target)) {
        wrapper.classList.remove('open');
      }
    });
  });
});

window.inicializarPrettySelects = inicializarPrettySelects;