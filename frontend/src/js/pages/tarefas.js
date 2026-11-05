import { savedTasks, savedSubjects, saveTask, removeTask, taskError } from '../models/task-store.js';
import { filterSavedTasks, isOverdue } from '../models/task-view.js';
import { todayKey, formatDay, shiftDay } from '../models/inicio-demo.js';

export function mountTasks() {
  const list = document.getElementById('tasks-list');
  const search = document.getElementById('tasks-search');
  const subject = document.getElementById('tasks-subject');
  const priority = document.getElementById('tasks-priority');
  const periods = document.getElementById('tasks-periods');
  const empty = document.getElementById('tasks-empty');
  const feedback = document.getElementById('tasks-feedback');
  let selectedPeriod = 'todas';
  const pending = new Set();
  const status = document.getElementById('tasks-status-filter');
  const help = {
    todas: 'Todas as tarefas, incluindo concluídas.',
    hoje: 'Tarefas de hoje, incluindo concluídas.',
    proximas: 'Pendentes de amanhã até os próximos 7 dias.',
    atrasadas: 'Tarefas pendentes cujo prazo já passou.',
    concluidas: 'Tarefas concluídas. Desmarque para reabrir.',
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function refreshSubjects() {
    const selected = subject.value;
    const emptyOption = element('option', '', 'Todas as disciplinas');
    emptyOption.value = '';
    subject.replaceChildren(emptyOption);
    savedSubjects.forEach(item => {
      const option = element('option', '', item.name);
      option.value = String(item.id);
      subject.append(option);
    });
    subject.value = savedSubjects.some(item => String(item.id) === selected) ? selected : '';
  }

  function dateLabel(day) {
    if (day === todayKey()) return 'Hoje';
    if (day === shiftDay(todayKey(), 1)) return 'Amanhã';
    return formatDay(day, { day: 'numeric', month: 'short' });
  }

  function render() {
    const items = filterSavedTasks(savedTasks, {
      period: selectedPeriod, query: search.value,
      subject: subject.value, priority: priority.value, status: status.value,
    });
    periods.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.period === selectedPeriod));
    });
    document.getElementById('tasks-period-help').textContent = help[selectedPeriod];
    document.getElementById('tasks-count').textContent = `${items.length} ${items.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'}`;
    empty.hidden = items.length !== 0;

    list.replaceChildren(...items.map(item => {
      const card = element('li', 'Tasks-card');
      card.classList.toggle('is-done', item.done);
      const checkbox = element('input', 'Tasks-check');
      checkbox.type = 'checkbox';
      checkbox.checked = item.done;
      checkbox.disabled = pending.has(item.id);
      checkbox.dataset.taskId = String(item.id);
      checkbox.setAttribute('aria-label', `${item.done ? 'Reabrir' : 'Concluir'} tarefa: ${item.title}`);
      const content = element('div', 'Tasks-card-content');
      const heading = element('div', 'Tasks-card-heading');
      const tone = { Alta: 'high', Média: 'medium', Baixa: 'low' }[item.priority];
      heading.append(element('strong', 'Tasks-card-title', item.title), element('span', `Tasks-badge Tasks-badge--${tone}`, item.priority));
      const meta = element('p', 'Tasks-meta');
      const date = element('time', '', dateLabel(item.date));
      date.dateTime = item.date;
      meta.append(date, element('span', '', item.time));
      if (isOverdue(item)) heading.append(element('span', 'Tasks-badge Tasks-badge--high', 'Atrasada'));
      content.append(heading, element('p', 'Tasks-subject', item.subject || 'Sem disciplina'), meta);
      if (item.description) {
        const details = element('details', 'Tasks-details');
        details.append(element('summary', '', 'Detalhes'));
        if (item.description) details.append(element('p', '', item.description));
        content.append(details);
      }
      async function mutate(action, message) {
        if (pending.has(item.id)) return;
        pending.add(item.id);
        render();
        try {
          await action();
          feedback.textContent = message;
        } catch (error) { feedback.textContent = taskError(error); }
        finally {
          pending.delete(item.id); render();
          (list.querySelector(`[data-task-id="${item.id}"]`) || periods.querySelector('[aria-pressed="true"]')).focus({ preventScroll: true });
        }
      }
      checkbox.addEventListener('change', () => {
        const done = checkbox.checked;
        mutate(() => saveTask(item.id, { status: done ? 'concluida' : 'pendente' }), `${item.title}: ${done ? 'concluída' : 'reaberta'} e salva.`);
      });
      const actions = element('div', 'Tasks-actions');
      const edit = element('a', 'Tasks-text-link', 'Editar');
      edit.href = `#adicionar?editar=${item.id}`;
      edit.setAttribute('aria-label', `Editar ${item.title}`);
      if (pending.has(item.id)) { edit.removeAttribute('href'); edit.setAttribute('aria-disabled', 'true'); }
      const remove = element('button', 'Tasks-delete', 'Excluir');
      remove.type = 'button'; remove.disabled = pending.has(item.id);
      remove.setAttribute('aria-label', `Excluir ${item.title}`);
      remove.addEventListener('click', () => {
        if (window.confirm(`Excluir a tarefa “${item.title}”? Essa ação não pode ser desfeita.`)) mutate(() => removeTask(item.id), `“${item.title}” excluída.`);
      });
      actions.append(edit, remove); content.append(actions);
      card.append(checkbox, content);
      return card;
    }));
  }

  periods.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      selectedPeriod = button.dataset.period;
      render();
    });
  });
  search.addEventListener('input', render);
  subject.addEventListener('change', render);
  priority.addEventListener('change', render);
  status.addEventListener('change', render);
  document.getElementById('tasks-clear').addEventListener('click', () => {
    selectedPeriod = 'todas';
    search.value = '';
    subject.value = '';
    priority.value = '';
    status.value = '';
    render();
    search.focus();
  });

  refreshSubjects();
  render();
  return (resetFilters = false) => {
    if (resetFilters) {
      selectedPeriod = 'todas';
      search.value = '';
      subject.value = '';
      priority.value = '';
      status.value = '';
    }
    refreshSubjects();
    render();
  };
}
