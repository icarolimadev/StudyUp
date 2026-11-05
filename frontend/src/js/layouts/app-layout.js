import { loadWorkspace, taskError } from '../models/task-store.js';
import { mountAccountSession } from '../components/account-session.js';
import { mountHome } from '../pages/inicio.js';
import { mountTasks } from '../pages/tarefas.js';
import { mountAddTask } from '../pages/adicionar.js';
import { mountSubjects } from '../pages/disciplinas.js';
import { mountAgenda } from '../pages/agenda.js';
import { mountProjects } from '../pages/projetos.js';
import { mountMoreMenu } from '../components/menu-mais.js';
import { mountNotifications } from '../pages/notificacoes.js';
import { mountNotificationPreferences } from '../pages/preferencias-notificacoes.js';

// Só inicializa as telas depois de consultar a conta no backend.
async function startApp() {
  if (!await mountAccountSession()) return;
  const refreshHome = mountHome();
  const refreshTasks = mountTasks();
  const refreshAddTask = mountAddTask();
  const refreshSubjects = mountSubjects();
  const refreshAgenda = mountAgenda();
  const refreshProjects = mountProjects();
  const refreshNotifications = mountNotifications();
  const refreshNotificationPreferences = mountNotificationPreferences();
  const moreMenu = mountMoreMenu();
  // O link após o cadastro mostra a lista sem filtros que ocultem a nova tarefa.
  document.getElementById('add-view-tasks').addEventListener('click', () => refreshTasks(true));
  const panels = [...document.querySelectorAll('.App-panel')];
  const links = [...document.querySelectorAll('.App-nav-link[href]')];

  // Pular o cabeçalho não é uma troca de tela: preserva a rota ao recarregar.
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('conteudo').focus();
  });

  const livePages = { inicio: refreshHome, tarefas: refreshTasks, adicionar: refreshAddTask, agenda: refreshAgenda };
  let navigation = 0;
  for (const id of Object.keys(livePages)) {
    const panel = document.getElementById(id);
    const box = document.createElement('div'); box.className = 'Data-status';
    const message = document.createElement('p'); message.setAttribute('role', 'status');
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Atualizar dados';
    retry.addEventListener('click', () => showPage(true));
    box.append(message, retry); panel.querySelector('h1').after(box);
  }

  async function showPage(moveFocus = false) {
    const [requestedId, query = ''] = window.location.hash.slice(1).split('?');
    if (requestedId === 'conteudo') return;
    const version = ++navigation;
    moreMenu.close();
    const activePanel = panels.find(panel => panel.id === requestedId) || panels[0];
    panels.forEach(panel => { panel.hidden = panel !== activePanel; });
    links.forEach(link => {
      if (link.hash === `#${activePanel.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const title = activePanel.querySelector('h1');
    if (moveFocus) { title.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    document.title = `${activePanel.dataset.pageTitle || title.textContent} | StudyUp`;

    if (livePages[activePanel.id]) {
      const box = activePanel.querySelector('.Data-status');
      activePanel.dataset.state = 'loading';
      box.querySelector('p').textContent = 'Carregando seus dados…';
      box.querySelector('button').disabled = true;
      try {
        await loadWorkspace();
        if (version !== navigation) return;
        if (activePanel.id === 'adicionar') refreshAddTask(new URLSearchParams(query).get('editar'));
        else livePages[activePanel.id]();
        activePanel.dataset.state = 'ready';
        box.querySelector('p').textContent = '';
      } catch (error) {
        if (version !== navigation) return;
        activePanel.dataset.state = 'error';
        box.querySelector('p').textContent = taskError(error);
      } finally { if (version === navigation) box.querySelector('button').disabled = false; }
    } else {
      if (activePanel.id === 'disciplinas') refreshSubjects();
      if (activePanel.id === 'projetos') refreshProjects();
      if (activePanel.id === 'notificacoes') refreshNotifications();
      if (activePanel.id === 'preferencias-notificacoes') refreshNotificationPreferences();
    }
    if (version !== navigation) return;
    document.title = `${activePanel.dataset.pageTitle || title.textContent} | StudyUp`;
    if (requestedId === 'mais') { window.history.replaceState(null, '', '#inicio'); moreMenu.open(); }
  }

  // Recalcula prazo/atraso com o relógio atual, sem apagar rascunhos de formulário.
  window.setInterval(() => {
    if (document.activeElement?.matches('input, select, textarea, button, a, summary')) return;
    const panel = panels.find(item => !item.hidden);
    if (!document.hidden && panel?.dataset.state === 'ready' && panel.id !== 'adicionar') livePages[panel.id]?.();
  }, 60000);
  // hashchange também ocorre ao usar Voltar/Avançar no navegador.
  window.addEventListener('hashchange', () => showPage(true));
  showPage();

}
startApp();
