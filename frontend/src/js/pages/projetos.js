import { demoActivities } from '../models/demo-state.js';
import { formatDay } from '../models/inicio-demo.js';
import { filterProjects, projectProgress, setProjectStep } from '../models/projetos-model.js';

export function mountProjects() {
  const list = document.getElementById('projects-list');
  const filters = document.getElementById('projects-filters');
  const feedback = document.getElementById('projects-feedback');
  const expanded = new Set();
  let selectedFilter = 'todos';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render() {
    filters.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === selectedFilter));
    });
    const projects = filterProjects(demoActivities, selectedFilter);
    document.getElementById('projects-empty').hidden = projects.length > 0;
    list.replaceChildren(...projects.map(project => {
      const progress = projectProgress(project);
      const card = element('li', 'Projects-card');
      const top = element('div', 'Projects-card-top');
      const icon = element('span', 'Projects-icon');
      icon.setAttribute('aria-hidden', 'true');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      svg.setAttribute('class', 'App-icon');
      use.setAttribute('href', '#icon-folder');
      svg.append(use);
      icon.append(svg);
      const status = progress.done ? 'Concluído' : progress.completed ? 'Em andamento' : 'Não iniciado';
      top.append(icon, element('span', `Projects-status${progress.done ? ' is-done' : ''}`, status));
      const description = element('div', 'Projects-progress-label');
      description.append(element('span', '', `${progress.completed} de ${progress.total} etapas`), element('strong', '', `${progress.percent}%`));
      const bar = element('progress', 'Projects-progress');
      bar.max = progress.total || 1;
      bar.value = progress.completed;
      bar.setAttribute('aria-label', `Progresso de ${project.title}`);
      const due = element('p', 'Projects-due');
      const time = element('time', '', `Prazo: ${formatDay(project.date, { day: '2-digit', month: '2-digit', year: 'numeric' })} • ${project.time}`);
      time.dateTime = `${project.date}T${project.time}:00-03:00`;
      due.append(time);
      card.append(top, element('h2', '', project.title), element('p', 'Projects-subject', project.subject || 'Sem disciplina'), description, bar, due);

      const details = element('details', 'Projects-details');
      details.open = expanded.has(project.id);
      const summary = element('summary', '', 'Ver etapas');
      details.append(summary);
      details.addEventListener('toggle', () => {
        if (!details.isConnected) return;
        if (details.open) expanded.add(project.id);
        else expanded.delete(project.id);
      });
      const steps = element('ol', 'Projects-steps');
      (project.steps || []).forEach(step => {
        const row = element('li', 'Projects-step');
        const label = element('label', '');
        const checkbox = element('input', '');
        checkbox.type = 'checkbox';
        checkbox.checked = step.done;
        checkbox.dataset.key = `${project.id}-${step.id}`;
        label.append(checkbox, element('span', '', step.title));
        checkbox.addEventListener('change', () => {
          expanded.add(project.id);
          setProjectStep(project, step.id, checkbox.checked);
          const nextProgress = projectProgress(project);
          render();
          // Um projeto concluído pode desaparecer do filtro Em andamento.
          const target = [...list.querySelectorAll('input')].find(input => input.dataset.key === `${project.id}-${step.id}`)
            || filters.querySelector('[aria-pressed="true"]');
          target.focus({ preventScroll: true });
          feedback.textContent = `${project.title}: ${nextProgress.completed} de ${nextProgress.total} etapas concluídas, ${nextProgress.percent}%.`;
        });
        row.append(label);
        steps.append(row);
      });
      details.append(steps);
      if (!progress.total) details.append(element('p', 'Projects-help', 'Nenhuma etapa cadastrada.'));
      card.append(details);
      return card;
    }));
  }

  filters.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      selectedFilter = button.dataset.filter;
      render();
      feedback.textContent = `${filterProjects(demoActivities, selectedFilter).length} projetos neste filtro.`;
    });
  });
  render();
  return render;
}
