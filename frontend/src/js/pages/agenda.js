import { savedTasks } from '../models/task-store.js';
import { isOverdue } from '../models/task-view.js';
import { todayKey, formatDay, shiftDay } from '../models/inicio-demo.js';
import { agendaSlots, isAgendaDate } from '../models/agenda-model.js';

export function mountAgenda() {
  let selectedDay = todayKey();
  const input = document.getElementById('agenda-date');
  const previous = document.getElementById('agenda-prev');
  const next = document.getElementById('agenda-next');
  const timeline = document.getElementById('agenda-timeline');
  const labels = { tarefa: 'Tarefa', prova: 'Prova', projeto: 'Projeto', evento: 'Evento' };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render(announce = false) {
    input.value = selectedDay;
    previous.disabled = selectedDay === '1000-01-01';
    next.disabled = selectedDay === '9999-12-31';
    document.getElementById('agenda-date-title').textContent = formatDay(selectedDay, { day: 'numeric', month: 'long' });
    document.getElementById('agenda-weekday').textContent = `${formatDay(selectedDay, { weekday: 'long' })} • ${selectedDay.slice(0, 4)}`;
    const slots = agendaSlots(savedTasks, selectedDay);
    const count = slots.reduce((total, slot) => total + slot.activities.length, 0);
    document.getElementById('agenda-empty').hidden = count > 0;
    timeline.replaceChildren(...slots.map(slot => {
      const row = element('li', 'Agenda-slot');
      const time = element('time', 'Agenda-time', slot.time);
      time.dateTime = `${selectedDay}T${slot.time.length === 5 ? slot.time + ':00' : slot.time}-03:00`;
      const content = element('div', 'Agenda-slot-content');
      slot.activities.forEach(item => {
        const card = element('details', `Agenda-card Agenda-card--${item.type}`);
        card.classList.toggle('is-done', item.done);
        const summary = element('summary', 'Agenda-card-summary');
        summary.append(element('strong', 'Agenda-card-title', item.title));
        summary.append(element('span', 'Agenda-card-subject', item.subject || 'Sem disciplina'));
        summary.append(element('span', 'Agenda-card-type', `${labels[item.type]}${item.done ? ' • Concluída' : ''}`));
        if (isOverdue(item)) summary.append(element('span', 'Tasks-badge Tasks-badge--high', 'Atrasada'));
        card.append(summary);
        if (item.description) card.append(element('p', 'Agenda-details', item.description));
        card.append(element('p', 'Agenda-details', `Horário: ${item.time} • Prioridade: ${item.priority}`));
        content.append(card);
      });
      row.append(time, content);
      return row;
    }));
    if (announce) {
      document.getElementById('agenda-feedback').textContent = `${formatDay(selectedDay, { dateStyle: 'full' })}: ${count} ${count === 1 ? 'atividade' : 'atividades'}.`;
    }
  }

  previous.addEventListener('click', () => {
    selectedDay = shiftDay(selectedDay, -1);
    render(true);
  });
  next.addEventListener('click', () => {
    selectedDay = shiftDay(selectedDay, 1);
    render(true);
  });
  document.getElementById('agenda-today').addEventListener('click', () => {
    selectedDay = todayKey();
    render(true);
  });
  input.addEventListener('change', () => {
    if (!input.checkValidity() || !isAgendaDate(input.value)) {
      input.reportValidity();
      input.value = selectedDay;
      return;
    }
    selectedDay = input.value;
    render(true);
  });
  render();
  return () => render();
}
