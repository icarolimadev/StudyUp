import { mountHome } from '../pages/inicio.js';
import { mountTasks } from '../pages/tarefas.js';
import { mountAddTask } from '../pages/adicionar.js';
import { mountSubjects } from '../pages/disciplinas.js';
import { mountAgenda } from '../pages/agenda.js';
import { mountProjects } from '../pages/projetos.js';
import { mountMoreMenu } from '../components/menu-mais.js';
import { mountNotifications } from '../pages/notificacoes.js';
import { mountNotificationPreferences } from '../pages/preferencias-notificacoes.js';

// Este módulo cuida apenas da apresentação; não acessa banco ou autenticação.
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

function showPage(moveFocus = false) {
  const requestedId = window.location.hash.slice(1);

  // O link de acessibilidade leva ao conteúdo sem trocar a página selecionada.
  if (requestedId === 'conteudo') return;

  moreMenu.close();

  const activePanel = panels.find(panel => panel.id === requestedId) || panels[0];

  panels.forEach(panel => {
    panel.hidden = panel !== activePanel;
  });

  if (activePanel.id === 'inicio') refreshHome();
  if (activePanel.id === 'tarefas') refreshTasks();
  if (activePanel.id === 'adicionar') refreshAddTask();
  if (activePanel.id === 'disciplinas') refreshSubjects();
  if (activePanel.id === 'agenda') refreshAgenda();
  if (activePanel.id === 'projetos') refreshProjects();
  if (activePanel.id === 'notificacoes') refreshNotifications();
  if (activePanel.id === 'preferencias-notificacoes') refreshNotificationPreferences();

  links.forEach(link => {
    if (link.hash === `#${activePanel.id}`) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  const title = activePanel.querySelector('h1');
  document.title = `${activePanel.dataset.pageTitle || title.textContent} | StudyUp`;

  if (moveFocus) {
    title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  // Compatibilidade com o antigo endereço #mais, agora um diálogo sobre Início.
  if (requestedId === 'mais') {
    window.history.replaceState(null, '', '#inicio');
    moreMenu.open();
  }
}

// hashchange também ocorre ao usar Voltar/Avançar no navegador.
window.addEventListener('hashchange', () => showPage(true));
showPage();
