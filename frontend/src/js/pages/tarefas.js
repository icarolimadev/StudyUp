import { demoToday, demoActivities, getDemoSubjects } from '../models/demo-state.js';
import { filterTasks } from '../models/tarefas-model.js';
import { formatDay, shiftDay } from '../models/inicio-demo.js';

export function mountTasks() {
  const list = document.getElementById('tasks-list');
  const search = document.getElementById('tasks-search');
  const subject = document.getElementById('tasks-subject');
  const priority = document.getElementById('tasks-priority');
  const periods = document.getElementById('tasks-periods');
  const empty = document.getElementById('tasks-empty');
  const feedback = document.getElementById('tasks-feedback');
  let selectedPeriod = 'todas';
  const help = {
    todas: 'Todas as tarefas, incluindo concluídas.',
    hoje: 'Tarefas de hoje, incluindo concluídas.',
    proximas: 'Pendentes de amanhã até os próximos 7 dias.',
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
    getDemoSubjects().forEach(name => {
      const option = element('option', '', name);
      option.value = name;
      subject.append(option);
    });
    subject.value = getDemoSubjects().includes(selected) ? selected : '';
  }

  function dateLabel(day) {
    if (day === demoToday) return 'Hoje';
    if (day === shiftDay(demoToday, 1)) return 'Amanhã';
    return formatDay(day, { day: 'numeric', month: 'short' });
  }

  function render() {
    const items = filterTasks(demoActivities, {
      period: selectedPeriod, query: search.value,
      subject: subject.value, priority: priority.value,
    }, demoToday);
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
      content.append(heading, element('p', 'Tasks-subject', item.subject || 'Sem disciplina'), meta);
      if (item.description || item.reminderMinutes) {
        const details = element('details', 'Tasks-details');
        details.append(element('summary', '', 'Detalhes'));
        if (item.description) details.append(element('p', '', item.description));
        if (item.reminderMinutes) details.append(element('p', '', `Lembrete: ${item.reminderMinutes} minutos antes (sem envio nesta demonstração).`));
        content.append(details);
      }
      checkbox.addEventListener('change', () => {
        const oldIndex = items.findIndex(task => task.id === item.id);
        item.done = checkbox.checked;
        render();
        // Na aba Concluídas, reabrir remove o cartão. Manter foco em algo útil.
        const controls = [...list.querySelectorAll('input')];
        const nextFocus = controls.find(input => input.dataset.taskId === String(item.id))
          || controls[Math.min(oldIndex, controls.length - 1)]
          || periods.querySelector('[aria-pressed="true"]');
        nextFocus.focus({ preventScroll: true });
        feedback.textContent = `${item.title}: ${item.done ? 'concluída' : 'reaberta'} nesta demonstração.`;
      });
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
  document.getElementById('tasks-clear').addEventListener('click', () => {
    selectedPeriod = 'todas';
    search.value = '';
    subject.value = '';
    priority.value = '';
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
    }
    refreshSubjects();
    render();
  };
}
