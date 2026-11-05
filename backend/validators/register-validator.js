export function validateRegistration(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const errors = {};
  if (!name || name.length > 150) errors.name = 'Informe um nome de até 150 caracteres.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um e-mail válido de até 254 caracteres.';
  }
  // Não removemos espaços nem truncamos a senha escolhida pelo estudante.
  if (password.length < 15 || password.length > 128 || !password.trim()) {
    errors.password = 'Use uma senha de 15 a 128 caracteres. Você pode usar uma frase.';
  }
  if (typeof input.password_confirmation !== 'string' || input.password_confirmation !== password) {
    errors.password_confirmation = 'As senhas precisam ser iguais.';
  }
  return { errors, values: { name, email, password } };
}
