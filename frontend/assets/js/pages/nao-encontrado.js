import { loadTemplate } from '../services/template-loader.js';
export async function prepareNaoEncontrado() {
  return { title: 'Página não encontrada', html: await loadTemplate('pages/nao-encontrado.html') };
}
