import { loadTemplate } from '../services/template-loader.js';
import { mountHeader } from '../components/header.js';
import { mountBottomNav } from '../components/bottom-nav.js';
import { requireElement } from '../utils/dom.js';

export async function mountAppLayout(root) {
  root.innerHTML = await loadTemplate('layouts/app-layout.html');
  await Promise.all([
    mountHeader(requireElement('[data-slot="header"]', root)),
    mountBottomNav(requireElement('[data-slot="navigation"]', root)),
  ]);
  return requireElement('#main-content', root);
}
