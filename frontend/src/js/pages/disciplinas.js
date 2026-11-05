import { demoSubjects, demoActivities, demoToday } from '../models/demo-state.js';
import { createSubject, subjectSummary } from '../models/disciplinas-model.js';
import { formatDay, shiftDay } from '../models/inicio-demo.js';

export function mountSubjects() {
  const list = document.getElementById('subjects-list');
  const panel = document.getElementById('subject-form-panel');
  const form = document.getElementById('subject-form');
  const name = document.getElementById('subject-name');
  const color = document.getElementById('subject-color');
  const open = document.getElementById('subjects-new');
  const error = document.getElementById('subject-error');
  const feedback = document.getElementById('subject-feedback');
  const submit = form.querySelector('[type="submit"]');

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function dayLabel(day) {
    if (day === demoToday) return 'Hoje';
    if (day === shiftDay(demoToday, 1)) return 'Amanhã';
    return formatDay(day, { day: 'numeric', month: 'short' });
  }

  function render() {
    document.getElementById('subjects-empty').hidden = demoSubjects.length > 0;
    list.replaceChildren(...demoSubjects.map(subject => {
      const summary = subjectSummary(subject, demoActivities, demoToday);
      const card = element('li', 'Subjects-card');
      const header = element('div', 'Subjects-card-header');
      const icon = element('span', `Subjects-icon Subjects-icon--${subject.color}`);
      icon.setAttribute('aria-hidden', 'true');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      svg.setAttribute('class', 'App-icon');
      use.setAttribute('href', '#icon-book');
      svg.append(use);
      icon.append(svg);
      const text = element('div', 'Subjects-card-text');
      const count = summary.pendingCount;
      text.append(element('h2', '', subject.name), element('p', '', `${count} ${count === 1 ? 'atividade pendente' : 'atividades pendentes'}`));
      header.append(icon, text);
      const next = element('div', 'Subjects-next');
      next.append(element('span', '', 'Próxima atividade'));
      next.append(element('strong', '', summary.next
        ? `${summary.next.title} • ${dayLabel(summary.next.date)}, ${summary.next.time}`
        : 'Nenhuma atividade prevista'));
      card.append(header, next);
      return card;
    }));
  }

  function clearErrors() {
    error.hidden = true;
    [name, color].forEach(field => {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    });
  }

  function closeForm() {
    form.reset();
    clearErrors();
    panel.hidden = true;
    open.setAttribute('aria-expanded', 'false');
    open.focus();
  }

  open.addEventListener('click', () => {
    panel.hidden = false;
    open.setAttribute('aria-expanded', 'true');
    feedback.textContent = '';
    name.focus();
  });
  document.getElementById('subject-cancel').addEventListener('click', closeForm);
  form.addEventListener('input', clearErrors);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    clearErrors();
    try {
      const result = createSubject(demoSubjects, { name: name.value, color: color.value });
      if (result.errors) {
        error.textContent = Object.values(result.errors).join(' ');
        error.hidden = false;
        Object.keys(result.errors).forEach(key => {
          const field = key === 'name' ? name : color;
          field.setAttribute('aria-invalid', 'true');
          field.setAttribute('aria-describedby', 'subject-error');
        });
        (result.errors.name ? name : color).focus();
        return;
      }
      render();
      closeForm();
      feedback.textContent = `“${result.subject.name}” cadastrada nesta demonstração. Você já pode selecioná-la ao adicionar uma tarefa.`;
    } finally {
      submit.disabled = false;
    }
  });

  render();
  return render;
}
