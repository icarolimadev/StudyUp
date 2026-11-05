import { todayKey, createDemo } from './inicio-demo.js';
import { createNotificationDemo, defaultNotificationPreferences } from './notificacoes-model.js';

// Os módulos compartilham a mesma lista em memória, sem criar uma cópia por tela.
// Ao recarregar o navegador, estes exemplos são recriados.
export const demoToday = todayKey();
export const demoActivities = createDemo(demoToday);
export const demoNotifications = createNotificationDemo(demoToday);
export const demoNotificationPreferences = defaultNotificationPreferences();

// Etapas nos próprios projetos: estado compartilhado com Agenda e resumos.
const projectExamples = [
  ['Definir requisitos', 'Desenhar as telas', 'Preparar a estrutura', 'Integrar o banco', 'Testar e apresentar'],
  ['Escolher o tema', 'Planejar a rede', 'Configurar os serviços', 'Validar a comunicação', 'Documentar a entrega'],
];
demoActivities.filter(item => item.type === 'projeto').forEach((project, index) => {
  project.steps = projectExamples[index].map((title, stepIndex) => ({
    id: stepIndex + 1, title, done: stepIndex < (index === 0 ? 3 : 2),
  }));
});

// Lista independente: uma disciplina existe mesmo antes de receber atividades.
export const demoSubjects = [
  { id: 1, name: 'Matemática', color: 'pink' },
  { id: 2, name: 'Física', color: 'blue' },
  { id: 3, name: 'Desenvolvimento Web', color: 'green' },
  { id: 4, name: 'Redes de Computadores', color: 'gold' },
  { id: 5, name: 'Português', color: 'green' },
  { id: 6, name: 'Projeto Integrador', color: 'blue' },
];

export function getDemoSubjects() {
  return demoSubjects.map(subject => subject.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
