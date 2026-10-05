import { loadTemplate } from '../services/template-loader.js';
import { createInicioController } from '../../controllers/inicio-controller.js';

export async function prepareInicio() {
  const controller = createInicioController();
  return {
    title: controller.getPageData().title,
    html: await loadTemplate('pages/inicio.html'),
    mount() {
      // Registre eventos da tela aqui. Retorne uma função que os remova.
      return () => {};
    },
  };
}
