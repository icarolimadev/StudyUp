import { mountAppLayout } from './layouts/app-layout.js';
import { startRouter } from './routes/router.js';
import { requireElement } from './utils/dom.js';

const root = requireElement('#app');
try {
  const main = await mountAppLayout(root);
  startRouter(main);
} catch (error) {
  console.error(error);
  root.textContent = 'Não foi possível iniciar o StudyUp. Recarregue para tentar novamente.';
} finally {
  root.removeAttribute('aria-busy');
}
