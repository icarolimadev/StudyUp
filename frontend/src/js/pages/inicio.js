import { weekDays, formatDay, tasksOnDay, upcoming } from '../models/inicio-demo.js';
import { demoToday as today, demoActivities as activities } from '../models/demo-state.js';

// Dados e cálculos ficam no módulo de demonstração; aqui montamos a interface.
export function mountHome() {
  let selectedDay = today;
  const week = document.getElementById('home-week');
  const tasks = document.getElementById('home-tasks');
  const stats = document.getElementById('home-stats');
  const deadlines = document.getElementById('home-deadlines');
  const feedback = document.getElementById('home-feedback');
  const fullDate = day => formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' });
  const types = [
    { key: 'tarefa', label: 'Tarefas', icon: '✓', tone: 'blue' },
    { key: 'prova', label: 'Provas', icon: '▤', tone: 'pink' },
    { key: 'projeto', label: 'Projetos', icon: 'icon-folder', tone: 'green' },
    { key: 'evento', label: 'Eventos', icon: 'icon-calendar', tone: 'gold' },
  ];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(type) {
    const badge = element('span', `Home-icon Home-icon--${type.tone}`);
    badge.setAttribute('aria-hidden', 'true');
    if (!type.icon.startsWith('icon-')) {
      badge.textContent = type.icon;
      return badge;
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.setAttribute('class', 'App-icon');
    use.setAttribute('href', `#${type.icon}`);
    svg.append(use);
    badge.append(svg);
    return badge;
  }

  function renderStats() {
    stats.replaceChildren(...types.map(type => {
      // O total inclui concluídas, como no print; não é um contador de pendências.
      const total = activities.filter(item => item.type === type.key && item.date === selectedDay).length;
      const card = element('div', 'Home-stat');
      card.append(icon(type), element('strong', '', String(total)), element('span', 'Home-stat-label', type.label));
      return card;
    }));
  }

  function renderDeadlines() {
    deadlines.replaceChildren(...upcoming(activities, today).slice(0, 3).map(item => {
      const row = element('li', 'Home-deadline');
      const text = element('div', 'Home-deadline-text');
      const date = item.date === today ? 'Hoje' : formatDay(item.date, { day: 'numeric', month: 'short' });
      text.append(element('strong', '', item.title), element('p', '', `${date} • ${item.time}`));
      row.append(icon(types.find(type => type.key === item.type)), text);
      return row;
    }));
    if (!deadlines.children.length) deadlines.append(element('li', 'Home-empty', 'Nenhum prazo pendente.'));
  }

  function renderTasks() {
    const items = tasksOnDay(activities, selectedDay);
    document.getElementById('home-empty').hidden = items.length > 0;
    tasks.replaceChildren(...items.map(item => {
      const card = element('li', 'Home-task');
      card.classList.toggle('is-done', item.done);
      const checkbox = element('input', 'Home-check');
      checkbox.type = 'checkbox';
      checkbox.checked = item.done;
      checkbox.setAttribute('aria-label', `Concluir tarefa: ${item.title}`);
      const details = element('details', 'Home-task-details');
      const summary = element('summary', 'Home-task-summary');
      const copy = element('span', 'Home-task-copy');
      copy.append(element('strong', 'Home-task-title', item.title), element('span', 'Home-task-subject', item.subject || 'Sem disciplina'), element('span', 'Home-task-time', `◷ ${item.time}`));
      const arrow = element('span', 'Home-task-arrow', '›');
      arrow.setAttribute('aria-hidden', 'true');
      summary.append(copy, arrow);
      details.append(summary, element('p', 'Home-task-extra', `Prioridade ${item.priority.toLowerCase()} • ${formatDay(item.date, { day: 'numeric', month: 'long' })}`));
      checkbox.addEventListener('change', () => {
        item.done = checkbox.checked;
        card.classList.toggle('is-done', item.done);
        renderDeadlines();
        feedback.textContent = `${item.title}: ${item.done ? 'concluída' : 'reaberta'} nesta demonstração.`;
      });
      card.append(checkbox, details);
      return card;
    }));
  }

  function selectDay(day, announce = true) {
    selectedDay = day;
    week.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.date === day));
    });
    document.getElementById('home-tasks-title').textContent = day === today
      ? 'Tarefas de hoje' : `Tarefas de ${formatDay(day, { day: 'numeric', month: 'short' })}`;
    renderStats();
    renderTasks();
    if (announce) feedback.textContent = `${fullDate(day)}: ${tasksOnDay(activities, day).length} tarefas.`;
  }

  document.getElementById('home-date').textContent = fullDate(today);
  week.replaceChildren(...weekDays(today).map(day => {
    const button = element('button', 'Home-day');
    button.type = 'button';
    button.dataset.date = day;
    button.setAttribute('aria-label', fullDate(day));
    if (day === today) button.setAttribute('aria-current', 'date');
    button.append(element('span', 'Home-day-name', formatDay(day, { weekday: 'short' }).replace('.', '')), element('strong', '', formatDay(day, { day: 'numeric' })));
    button.addEventListener('click', () => selectDay(day));
    return button;
  }));
  selectDay(today, false);
  renderDeadlines();
  // O layout chama esta função ao voltar ao Início, refletindo outras telas.
  return () => {
    selectDay(selectedDay, false);
    renderDeadlines();
  };
}
