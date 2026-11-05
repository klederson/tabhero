// Search stays inside the picker. Typing/highlighting never changes the
// recipient; only an explicit option click or Enter commits a selection.
export function createRecipientPicker({ document, messages, load, select, error, blocked, openChanged }) {
  const trigger = document.getElementById('recipient');
  const value = document.getElementById('recipient-value');
  const menu = document.getElementById('recipient-menu');
  const search = document.getElementById('recipient-search');
  const list = document.getElementById('recipient-options');
  const empty = document.getElementById('recipient-empty');
  let selected = null;
  let options = [];
  let active = 0;
  let revision = 0;
  let timer;
  let disabled = false;
  const isOpen = () => !menu.hidden;
  const label = item => `${item.name}${item.unread ? ` (${item.unread})` : ''}`;
  function highlight(index) {
    active = index;
    const nodes = [...list.children];
    nodes.forEach((node, i) => { node.setAttribute('aria-selected', String(i === active)); });
    if (nodes[active]) {
      search.setAttribute('aria-activedescendant', nodes[active].id);
      nodes[active].scrollIntoView({ block: 'nearest' });
    } else search.removeAttribute('aria-activedescendant');
  }
  function close() {
    const wasOpen = isOpen();
    revision++; clearTimeout(timer); menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false'); search.setAttribute('aria-expanded', 'false');
    search.removeAttribute('aria-activedescendant');
    if (wasOpen) openChanged(false);
  }
  async function choose(item) {
    if (!item || disabled || blocked()) return;
    close(); trigger.focus();
    try { await select(item); } catch { error(); }
  }
  function render(items) {
    options = items;
    list.replaceChildren(...items.map((item, index) => {
      const node = document.createElement('li');
      node.id = `recipient-option-${index}`;
      node.setAttribute('role', 'option');
      node.dataset.chatId = item.id;
      node.textContent = label(item);
      node.addEventListener('pointerdown', event => event.preventDefault());
      node.addEventListener('click', () => choose(item));
      return node;
    }));
    empty.hidden = items.length > 0;
    empty.textContent = messages.noMatches;
    highlight(0);
  }
  async function update() {
    const current = ++revision;
    list.setAttribute('aria-busy', 'true');
    // Do not leave options from a previous query clickable during the lookup.
    render([]); empty.textContent = messages.loading;
    try {
      const items = await load(search.value);
      if (current !== revision || !isOpen()) return;
      render(items);
    } catch {
      if (current !== revision || !isOpen()) return;
      render([]); empty.textContent = messages.checkFailed;
    } finally { if (current === revision) list.setAttribute('aria-busy', 'false'); }
  }
  function open() {
    if (disabled || blocked()) return;
    menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); search.setAttribute('aria-expanded', 'true');
    openChanged(true);
    search.value = ''; search.focus(); update();
  }
  trigger.addEventListener('click', () => isOpen() ? close() : open());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
  });
  search.addEventListener('input', () => {
    revision++; clearTimeout(timer); render([]); empty.textContent = messages.loading;
    timer = setTimeout(update, 120);
  });
  search.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (options.length) highlight((active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter') { event.preventDefault(); choose(options[active]); }
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); trigger.focus(); }
    else if (event.key === 'Tab') close();
  });
  document.addEventListener('pointerdown', event => {
    if (!document.getElementById('recipient-picker').contains(event.target)) close();
  });
  document.addEventListener('focusin', event => {
    if (!document.getElementById('recipient-picker').contains(event.target)) close();
  });
  return {
    close,
    setSelected(item) { selected = item ?? null; value.textContent = selected ? label(selected) : messages.noSelection; trigger.title = value.textContent; },
    setDisabled(value) { disabled = Boolean(value); trigger.disabled = disabled; search.disabled = disabled; if (disabled) close(); }
  };
}
