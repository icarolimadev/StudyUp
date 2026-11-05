import { todayKey, weekDays, formatDay, tasksOnDay } from '../models/inicio-demo.js';
import { savedTasks as activities, saveTask, taskError } from '../models/task-store.js';
import { isOverdue, nowInFortaleza } from '../models/task-view.js';

// A lista compartilhada contém apenas tarefas devolvidas pela API da conta.
export function mountHome() {
  let today = todayKey();
  let selectedDay = today;
  const pending = new Set();
  const week = document.getElementById('home-week');
  const tasks = document.getElementById('home-tasks');
  const stats = document.getElementById('home-stats');
  const deadlines = document.getElementById('home-deadlines');
  const feedback = document.getElementById('home-feedback');
  const fullDate = day => formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' });
  const types = [
    { key: 'all', label: 'Total', icon: '✓', tone: 'blue' },
    { key: 'pending', label: 'Pendentes', icon: '◷', tone: 'gold' },
    { key: 'overdue', label: 'Atrasadas', icon: '!', tone: 'pink' },
    { key: 'done', label: 'Concluídas', icon: '✓', tone: 'green' },
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
      // Resumo de todas as tarefas da conta; a semana filtra somente a lista abaixo.
      const total = activities.filter(item => type.key === 'all' || (type.key === 'pending' && !item.done) || (type.key === 'overdue' && isOverdue(item)) || (type.key === 'done' && item.done)).length;
      const card = element('div', 'Home-stat');
      card.append(icon(type), element('strong', '', String(total)), element('span', 'Home-stat-label', type.label));
      return card;
    }));
  }

  function renderDeadlines() {
    deadlines.replaceChildren(...activities.filter(item => !item.done && item.deadline >= nowInFortaleza()).sort((a, b) => a.deadline.localeCompare(b.deadline) || a.id - b.id).slice(0, 3).map(item => {
      const row = element('li', 'Home-deadline');
      const text = element('div', 'Home-deadline-text');
      const date = item.date === today ? 'Hoje' : formatDay(item.date, { day: 'numeric', month: 'short' });
      text.append(element('strong', '', item.title), element('p', '', `${date} • ${item.time}`));
      row.append(icon(types[0]), text);
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
      checkbox.disabled = pending.has(item.id);
      checkbox.dataset.taskId = String(item.id);
      checkbox.setAttribute('aria-label', `${item.done ? 'Reabrir' : 'Concluir'} tarefa: ${item.title}`);
      const details = element('details', 'Home-task-details');
      const summary = element('summary', 'Home-task-summary');
      const copy = element('span', 'Home-task-copy');
      copy.append(element('strong', 'Home-task-title', item.title), element('span', 'Home-task-subject', item.subject || 'Sem disciplina'), element('span', 'Home-task-time', `◷ ${item.time}`));
      if (isOverdue(item)) copy.append(element('span', 'Tasks-badge Tasks-badge--high', 'Atrasada'));
      const arrow = element('span', 'Home-task-arrow', '›');
      arrow.setAttribute('aria-hidden', 'true');
      summary.append(copy, arrow);
      details.append(summary, element('p', 'Home-task-extra', `Prioridade ${item.priority.toLowerCase()} • ${formatDay(item.date, { day: 'numeric', month: 'long' })}`));
      checkbox.addEventListener('change', async () => {
        const done = checkbox.checked;
        pending.add(item.id); renderTasks();
        try {
          await saveTask(item.id, { status: done ? 'concluida' : 'pendente' });
          feedback.textContent = `${item.title}: ${done ? 'concluída' : 'reaberta'} e salva.`;
        } catch (error) { feedback.textContent = taskError(error); }
        finally {
          pending.delete(item.id); renderTasks(); renderStats(); renderDeadlines();
          tasks.querySelector(`[data-task-id="${item.id}"]`)?.focus({ preventScroll: true });
        }
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

  function renderWeek() {
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
  }
  renderWeek();
  selectDay(today, false);
  renderDeadlines();
  // O layout chama esta função ao voltar ao Início, refletindo outras telas.
  return () => {
    if (today !== todayKey()) { today = todayKey(); selectedDay = today; renderWeek(); }
    selectDay(selectedDay, false);
    renderDeadlines();
  };
}
