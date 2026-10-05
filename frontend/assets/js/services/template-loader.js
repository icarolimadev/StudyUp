const templates = new Map();
const viewsUrl = new URL('../../views/', import.meta.url);

// Os caminhos são definidos pelo código da aplicação, nunca por conteúdo do usuário.
export async function loadTemplate(path) {
  if (templates.has(path)) return templates.get(path);
  const response = await fetch(new URL(path, viewsUrl));
  if (!response.ok) throw new Error(`Falha ao carregar template: ${path} (${response.status})`);
  const html = await response.text();
  templates.set(path, html);
  return html;
}
