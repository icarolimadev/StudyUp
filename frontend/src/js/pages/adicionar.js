import { demoActivities, demoToday, getDemoSubjects } from '../models/demo-state.js';
import { createTask } from '../models/tarefas-model.js';

export function mountAddTask() {
  const form = document.getElementById('add-task-form');
  const reminder = document.getElementById('add-reminder');
  const reminderOptions = document.getElementById('add-reminder-options');
  const error = document.getElementById('add-error');
  const result = document.getElementById('add-result');
  const success = document.getElementById('add-success');
  const submit = form.querySelector('button[type="submit"]');
  const fields = form.elements;
  fields.date.value = demoToday;

  function refreshSubjects() {
    const selected = fields.subject.value;
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Sem disciplina';
    fields.subject.replaceChildren(empty);
    getDemoSubjects().forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      fields.subject.append(option);
    });
    fields.subject.value = getDemoSubjects().includes(selected) ? selected : '';
  }

  function updateReminder() {
    reminderOptions.hidden = !reminder.checked;
    fields.reminderMinutes.disabled = !reminder.checked;
  }

  function clearErrors() {
    error.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    });
    reminder.setAttribute('aria-describedby', 'add-reminder-help');
  }

  reminder.addEventListener('change', updateReminder);
  form.addEventListener('input', () => {
    // Mensagem e marcações são limpas juntas; o próximo envio valida tudo.
    clearErrors();
    result.hidden = true;
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    clearErrors();
    result.hidden = true;

    try {
      const outcome = createTask(demoActivities, {
        title: fields.title.value, description: fields.description.value,
        subject: fields.subject.value, date: fields.date.value, time: fields.time.value,
        priority: fields.priority.value,
        reminderEnabled: reminder.checked, reminderMinutes: fields.reminderMinutes.value,
      }, getDemoSubjects());

      if (outcome.errors) {
        error.textContent = Object.values(outcome.errors).join(' ');
        error.hidden = false;
        const firstName = Object.keys(outcome.errors)[0];
        Object.keys(outcome.errors).forEach(name => {
          const field = name === 'priority' ? form.querySelector('[name="priority"]') : fields[name];
          field.setAttribute('aria-invalid', 'true');
          field.setAttribute('aria-describedby', 'add-error');
        });
        const first = firstName === 'priority' ? form.querySelector('[name="priority"]') : fields[firstName];
        first.focus();
        return;
      }

      form.reset();
      fields.date.value = demoToday;
      updateReminder();
      success.textContent = `“${outcome.task.title}” adicionada à lista de Tarefas desta demonstração. Os dados serão apagados ao recarregar.`;
      result.hidden = false;
      success.focus();
    } finally {
      submit.disabled = false;
    }
  });

  refreshSubjects();
  updateReminder();
  return refreshSubjects;
}
