import { savedTasks, savedSubjects, saveTask, taskError } from '../models/task-store.js';
import { priorityValues } from '../models/task-view.js';
import { todayKey } from '../models/inicio-demo.js';

export function mountAddTask() {
  const form = document.getElementById('add-task-form');
  const fields = form.elements;
  const error = document.getElementById('add-error');
  const result = document.getElementById('add-result');
  const success = document.getElementById('add-success');
  const submit = form.querySelector('[type="submit"]');
  let editingId = null;
  let currentKey = null;
  let busy = false;

  function clearErrors() {
    error.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => {
      field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby');
    });
  }

  function refreshSubjects(selected) {
    const none = new Option('Sem disciplina', '');
    fields.subject.replaceChildren(none, ...savedSubjects.map(subject => new Option(subject.name, String(subject.id))));
    if (selected && !savedSubjects.some(subject => String(subject.id) === selected)) {
      fields.subject.append(new Option('Disciplina indisponível — selecione outra', selected));
    }
    fields.subject.value = selected;
  }

  function refresh(idText = null) {
    const key = idText || 'new';
    const task = idText ? savedTasks.find(item => String(item.id) === idText) : null;
    if (idText && !task) throw new Error('Tarefa não encontrada na sua conta. Volte à lista de tarefas.');
    if (key !== currentKey) {
      form.reset(); clearErrors(); result.hidden = true;
      fields.date.value = todayKey();
      editingId = task?.id ?? null;
      refreshSubjects(task?.subjectId ? String(task.subjectId) : '');
      if (task) {
        fields.title.value = task.title; fields.description.value = task.description || '';
        fields.date.value = task.date; fields.time.value = task.deadline.slice(11);
        fields.priority.value = task.priority;
      }
      currentKey = key;
    } else refreshSubjects(fields.subject.value);
    document.getElementById('adicionar-title').textContent = task ? 'Editar tarefa' : 'Adicionar tarefa';
    document.getElementById('add-cancel-edit').hidden = !task;
    submit.textContent = task ? 'Salvar alterações' : 'Salvar tarefa';
  }

  form.addEventListener('input', () => { clearErrors(); result.hidden = true; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    clearErrors(); result.hidden = true;
    const body = {
      title: fields.title.value, description: fields.description.value || null,
      subjectId: fields.subject.value ? Number(fields.subject.value) : null,
      deadline: `${fields.date.value}T${fields.time.value}`, priority: priorityValues[fields.priority.value],
    };
    busy = true; submit.disabled = true; submit.textContent = 'Salvando…';
    const editable = [...form.querySelectorAll('input:not([disabled]), textarea, select:not([disabled])')];
    editable.forEach(field => { field.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    try {
      const task = await saveTask(editingId, body);
      if (!editingId) { form.reset(); fields.date.value = todayKey(); }
      success.textContent = `“${task.title}” ${editingId ? 'atualizada' : 'cadastrada'} e salva na sua conta.`;
      result.hidden = false; success.focus();
    } catch (failure) {
      const errors = failure.fields || {};
      error.textContent = Object.keys(errors).length ? Object.values(errors).join(' ') : taskError(failure);
      error.hidden = false;
      const map = { title: fields.title, description: fields.description, subjectId: fields.subject,
        deadline: fields.date, priority: form.querySelector('[name="priority"]') };
      editable.forEach(field => { field.disabled = false; });
      const invalid = Object.keys(errors).map(key => map[key]).filter(Boolean);
      invalid.forEach(field => { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'add-error'); });
      (invalid[0] || fields.title).focus();
    } finally {
      editable.forEach(field => { field.disabled = false; });
      busy = false; submit.disabled = false; form.removeAttribute('aria-busy');
      submit.textContent = editingId ? 'Salvar alterações' : 'Salvar tarefa';
    }
  });
  return refresh;
}
