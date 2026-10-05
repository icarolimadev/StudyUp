import { config } from '../base/config.js';
import { routes, fallbackRoute } from './routes.js';
import { updateBottomNav } from '../components/bottom-nav.js';

export function startRouter(container) {
  let revision = 0;
  let cleanup;
  async function render() {
    // Âncoras comuns, como o link de acessibilidade, não são rotas.
    if (location.hash && !location.hash.startsWith('#/')) return;
    const current = ++revision;
    const path = location.hash.slice(1) || config.defaultRoute;
    container.setAttribute('aria-busy', 'true');
    try {
      const page = await (routes.get(path) ?? fallbackRoute)();
      if (current !== revision) return;
      cleanup?.();
      cleanup = undefined;
      container.innerHTML = page.html;
      document.title = `${page.title} | ${config.appName}`;
      updateBottomNav(path);
      cleanup = page.mount?.(container);
      container.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    } catch (error) {
      if (current !== revision) return;
      console.error(error);
      container.textContent = 'Não foi possível carregar a página. Recarregue para tentar novamente.';
      container.focus();
    } finally {
      if (current === revision) container.removeAttribute('aria-busy');
    }
  }
  if (!location.hash.startsWith('#/')) {
    history.replaceState(null, '', `#${config.defaultRoute}`);
  }
  window.addEventListener('hashchange', render);
  void render();
  return () => {
    revision++;
    cleanup?.();
    window.removeEventListener('hashchange', render);
  };
}
