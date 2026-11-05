const form = document.getElementById('Auth-login-form');
const submit = document.getElementById('Auth-login-submit');
const feedback = document.getElementById('Auth-login-feedback');
const email = form.elements.email;
const password = form.elements.password;

form.addEventListener('input', () => { feedback.hidden = true; });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  submit.disabled = true;
  submit.textContent = 'Entrando…';
  form.setAttribute('aria-busy', 'true');
  feedback.hidden = true;
  email.readOnly = password.readOnly = true;
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) {
      feedback.textContent = result.error || 'Não foi possível entrar. Tente novamente.';
      feedback.hidden = false;
      feedback.focus();
      return;
    }
    password.value = '';
    window.location.assign('/views/pages/app.html#inicio');
  } catch {
    feedback.textContent = 'Não foi possível confirmar o login. Confira sua conexão e tente novamente.';
    feedback.hidden = false;
    feedback.focus();
  } finally {
    email.readOnly = password.readOnly = false;
    submit.disabled = false;
    submit.textContent = 'Entrar';
    form.removeAttribute('aria-busy');
  }
});
submit.disabled = false;

const toggle = document.querySelector('.Auth-password-toggle');
toggle.disabled = false;
toggle.addEventListener('click', () => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  toggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  toggle.setAttribute('aria-pressed', String(show));
});
