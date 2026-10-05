import { loadTemplate } from '../services/template-loader.js';
export async function mountHeader(container) {
  container.innerHTML = await loadTemplate('components/header.html');
}
