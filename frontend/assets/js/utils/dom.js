export function requireElement(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Elemento obrigatório ausente: ${selector}`);
  return element;
}
