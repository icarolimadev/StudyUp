import { accountRequest } from '../components/account-session.js';

export function mountSubjects() {
  const list = document.getElementById('subjects-list');
  const panel = document.getElementById('subject-form-panel');
  const form = document.getElementById('subject-form');
  const name = document.getElementById('subject-name');
  const color = document.getElementById('subject-color');
  const open = document.getElementById('subjects-new');
  const cancel = document.getElementById('subject-cancel');
  const retry = document.getElementById('subjects-retry');
  const error = document.getElementById('subject-error');
  const feedback = document.getElementById('subject-feedback');
  const status = document.getElementById('subjects-status');
  const empty = document.getElementById('subjects-empty');
  const submit = form.querySelector('[type="submit"]');
  let subjects = [];
  let editingId = null;
  let busy = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setBusy(value) {
    busy = value;
    [open, cancel, retry, submit, color, ...list.querySelectorAll('button')].forEach(button => { button.disabled = value; });
    name.readOnly = value;
    form.setAttribute('aria-busy', String(value));
  }

  function render() {
    empty.hidden = subjects.length > 0;
    list.replaceChildren(...subjects.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(subject => {
      const card = element('li', 'Subjects-card');
      const header = element('div', 'Subjects-card-header');
      const tone = ['green', 'blue', 'pink', 'gold'].includes(subject.color) ? subject.color : 'green';
      const icon = element('span', `Subjects-icon Subjects-icon--${tone}`);
      icon.setAttribute('aria-hidden', 'true');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      svg.setAttribute('class', 'App-icon'); use.setAttribute('href', '#icon-book');
      svg.append(use); icon.append(svg);
      const text = element('div', 'Subjects-card-text');
      const count = subject.pendingCount || 0;
      text.append(element('h2', '', subject.name), element('p', '', `${count} ${count === 1 ? 'tarefa pendente no banco' : 'tarefas pendentes no banco'}`));
      header.append(icon, text);
      const actions = element('div', 'Subjects-card-actions');
      const edit = element('button', 'Subjects-edit', 'Editar');
      edit.type = 'button'; edit.dataset.editId = String(subject.id);
      edit.setAttribute('aria-label', `Editar ${subject.name}`);
      edit.addEventListener('click', () => showForm(subject));
      const remove = element('button', 'Subjects-delete', 'Excluir');
      remove.type = 'button'; remove.setAttribute('aria-label', `Excluir ${subject.name}`);
      remove.addEventListener('click', () => removeSubject(subject));
      actions.append(edit, remove); card.append(header, actions);
      return card;
    }));
  }

  function clearErrors() {
    error.hidden = true;
    [name, color].forEach(field => { field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby'); });
  }

  function showForm(subject = null) {
    if (busy) return;
    form.reset(); clearErrors(); editingId = subject?.id ?? null;
    document.getElementById('subject-form-title').textContent = subject ? 'Editar disciplina' : 'Nova disciplina';
    if (subject) { name.value = subject.name; color.value = subject.color || 'green'; }
    panel.hidden = false; open.setAttribute('aria-expanded', 'true');
    feedback.textContent = ''; name.focus();
  }

  function closeForm() {
    const previousId = editingId;
    editingId = null; form.reset(); clearErrors(); panel.hidden = true;
    open.setAttribute('aria-expanded', 'false');
    (list.querySelector(`[data-edit-id="${previousId}"]`) || open).focus();
  }

  function failureMessage(failure) {
    return failure.name === 'TypeError' || failure.name === 'TimeoutError'
      ? 'Não foi possível confirmar a operação. Confira a conexão e atualize a lista antes de tentar novamente.'
      : failure.message;
  }

  async function load() {
    if (busy) return;
    setBusy(true); status.textContent = 'Carregando disciplinas…'; retry.hidden = true; empty.hidden = true;
    try {
      const data = await accountRequest('/api/disciplinas');
      subjects = data.subjects; render(); status.textContent = '';
    } catch (failure) {
      list.replaceChildren(); status.textContent = failureMessage(failure); retry.hidden = false;
    } finally { setBusy(false); }
  }

  async function removeSubject(subject) {
    if (busy || !window.confirm(`Excluir a disciplina “${subject.name}”? Essa ação não pode ser desfeita.`)) return;
    setBusy(true); feedback.textContent = 'Excluindo disciplina…';
    try {
      await accountRequest(`/api/disciplinas/${subject.id}`, { method: 'DELETE' });
      subjects = subjects.filter(item => item.id !== subject.id); render(); setBusy(false);
      if (editingId === subject.id) closeForm(); else open.focus();
      feedback.textContent = `“${subject.name}” excluída da sua conta.`;
    } catch (failure) { feedback.textContent = failureMessage(failure); }
    finally { setBusy(false); }
  }

  open.addEventListener('click', () => showForm());
  cancel.addEventListener('click', closeForm);
  retry.addEventListener('click', load);
  form.addEventListener('input', clearErrors);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); clearErrors(); submit.textContent = 'Salvando…';
    const id = editingId;
    try {
      const { subject } = await accountRequest(id ? `/api/disciplinas/${id}` : '/api/disciplinas', {
        method: id ? 'PATCH' : 'POST', body: { name: name.value, color: color.value },
      });
      if (id) subjects = subjects.map(item => item.id === id ? { ...item, ...subject } : item);
      else subjects.push(subject);
      render(); setBusy(false); closeForm(); status.textContent = ''; retry.hidden = true;
      feedback.textContent = `“${subject.name}” ${id ? 'atualizada' : 'cadastrada'} e salva na sua conta.`;
    } catch (failure) {
      error.textContent = failureMessage(failure); error.hidden = false;
      const invalid = [name, color].filter(field => Object.hasOwn(failure.fields || {}, field.name));
      invalid.forEach(field => { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'subject-error'); });
      setBusy(false); (invalid[0] || name).focus();
    } finally { setBusy(false); submit.textContent = 'Salvar disciplina'; }
  });
  return load;
}
