import { demoNotificationPreferences } from '../models/demo-state.js';
import { saveNotificationPreferences } from '../models/notificacoes-model.js';

export function mountNotificationPreferences() {
  const form = document.getElementById('notification-preferences-form');
  const feedback = document.getElementById('preferences-feedback');
  const error = document.getElementById('preferences-error');
  const keys = ['tasks', 'exams', 'projects', 'events', 'deadlines'];

  function clearErrors() {
    error.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => {
      field.removeAttribute('aria-invalid');
      // Restaura a descrição original do campo que já tinha ajuda associada.
      if (field.name === 'tasks') field.setAttribute('aria-describedby', 'pref-tasks-help');
      else field.removeAttribute('aria-describedby');
    });
  }

  function refresh() {
    keys.forEach(key => { form.elements[key].checked = demoNotificationPreferences[key]; });
    form.elements.advanceDays.value = String(demoNotificationPreferences.advanceDays);
    clearErrors();
    feedback.textContent = '';
  }

  form.addEventListener('input', () => {
    clearErrors();
    feedback.textContent = 'Alterações ainda não salvas.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = { advanceDays: form.elements.advanceDays.value };
    keys.forEach(key => { input[key] = form.elements[key].checked; });
    const result = saveNotificationPreferences(demoNotificationPreferences, input);
    clearErrors();
    if (result.errors) {
      error.textContent = Object.values(result.errors).join(' ');
      error.hidden = false;
      Object.keys(result.errors).forEach(key => {
        form.elements[key].setAttribute('aria-invalid', 'true');
        form.elements[key].setAttribute('aria-describedby', 'preferences-error');
      });
      form.elements[Object.keys(result.errors)[0]].focus();
      return;
    }
    feedback.textContent = 'Preferências salvas nesta demonstração. Nenhum aviso será enviado; recarregar restaura o padrão.';
  });
  refresh();
  return refresh;
}
