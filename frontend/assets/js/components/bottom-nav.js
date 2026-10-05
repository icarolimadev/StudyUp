import { loadTemplate } from '../services/template-loader.js';
export async function mountBottomNav(container) {
  container.innerHTML = await loadTemplate('components/bottom-nav.html');
}
export function updateBottomNav(path) {
  document.querySelectorAll('[data-route]').forEach((link) => {
    if (link.dataset.route === path) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
