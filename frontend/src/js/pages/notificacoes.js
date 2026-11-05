import { demoNotifications, demoToday } from '../models/demo-state.js';
import { notificationGroups, markNotificationRead, markAllNotificationsRead } from '../models/notificacoes-model.js';
import { formatDay } from '../models/inicio-demo.js';

export function mountNotifications() {
  const container = document.getElementById('notifications-groups');
  const filters = document.getElementById('notifications-filters');
  const readAll = document.getElementById('notifications-read-all');
  const feedback = document.getElementById('notifications-feedback');
  const types = { tarefa: ['Tarefa', 'icon-book'], projeto: ['Projeto', 'icon-folder'], prova: ['Prova', 'icon-book'], evento: ['Evento', 'icon-calendar'] };
  let selectedType = 'todas';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function updateCounts() {
    const unread = demoNotifications.filter(item => !item.read).length;
    const label = `${unread} ${unread === 1 ? 'não lida' : 'não lidas'}`;
    document.querySelectorAll('[data-notification-count]').forEach(node => { node.textContent = label; });
    document.getElementById('notifications-count').textContent = `${label} no total`;
    // aria-disabled mantém o foco no botão após a leitura de todas.
    readAll.setAttribute('aria-disabled', String(unread === 0));
  }

  function render() {
    const groups = notificationGroups(demoNotifications, selectedType, demoToday);
    filters.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.type === selectedType));
    });
    document.getElementById('notifications-empty').hidden = groups.length > 0;
    container.replaceChildren(...groups.map((group, index) => {
      const section = element('section', 'Notifications-group');
      const heading = element('h2', '', group.label);
      heading.id = `notification-group-${index}`;
      section.setAttribute('aria-labelledby', heading.id);
      const list = element('ul', 'Notifications-list');
      list.append(...group.items.map(item => {
        const row = element('li', `Notifications-item Notifications-item--${item.type}`);
        row.classList.toggle('is-unread', !item.read);
        const icon = element('span', 'Notifications-icon');
        icon.setAttribute('aria-hidden', 'true');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        svg.setAttribute('class', 'App-icon');
        use.setAttribute('href', `#${types[item.type][1]}`);
        svg.append(use);
        icon.append(svg);
        const body = element('div', 'Notifications-body');
        const headingRow = element('div', 'Notifications-item-heading');
        const state = element('span', 'Notifications-state', item.read ? 'Lida' : 'Não lida');
        headingRow.append(element('h3', '', item.title), state);
        const timestamp = element('time', 'Notifications-time', `${formatDay(item.date, { day: 'numeric', month: 'short' })} • ${item.time}`);
        timestamp.dateTime = `${item.date}T${item.time}:00-03:00`;
        const action = element('button', 'Notifications-read', item.read ? 'Lida' : 'Marcar como lida');
        action.type = 'button';
        action.setAttribute('aria-disabled', String(item.read));
        action.setAttribute('aria-label', `${item.read ? 'Notificação lida' : 'Marcar como lida'}: ${item.title}`);
        action.addEventListener('click', () => {
          if (item.read) return;
          markNotificationRead(demoNotifications, item.id);
          row.classList.remove('is-unread');
          state.textContent = 'Lida';
          action.textContent = 'Lida';
          action.setAttribute('aria-label', `Notificação lida: ${item.title}`);
          action.setAttribute('aria-disabled', 'true');
          updateCounts();
          feedback.textContent = `${item.title}: marcada como lida.`;
        });
        body.append(headingRow, element('p', 'Notifications-message', item.message), element('span', 'Notifications-type', types[item.type][0]), timestamp, action);
        row.append(icon, body);
        return row;
      }));
      section.append(heading, list);
      return section;
    }));
    updateCounts();
  }

  filters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    selectedType = button.dataset.type;
    render();
    const count = notificationGroups(demoNotifications, selectedType, demoToday).reduce((total, group) => total + group.items.length, 0);
    feedback.textContent = `${count} notificações neste filtro.`;
  }));
  readAll.addEventListener('click', () => {
    const count = markAllNotificationsRead(demoNotifications);
    if (!count) return;
    render();
    feedback.textContent = `${count} notificações marcadas como lidas, incluindo outros filtros.`;
  });
  render();
  return render;
}
