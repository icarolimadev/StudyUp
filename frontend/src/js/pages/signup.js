const form = document.getElementById('Auth-signup-form');
const submit = document.getElementById('Auth-signup-submit');
const feedback = document.getElementById('Auth-signup-feedback');
const fields = form.elements;
const names = ['name', 'email', 'password', 'password_confirmation'];

function clearErrors() {
  names.forEach(name => {
    const field = fields.namedItem(name);
    field.removeAttribute('aria-invalid');
    field.setAttribute('aria-describedby', `${field.id}-help`);
  });
  fields.password_confirmation.setCustomValidity('');
  feedback.hidden = true;
}

function showFeedback(message, success = false) {
  feedback.textContent = message;
  feedback.classList.toggle('is-success', success);
  feedback.hidden = false;
}

form.addEventListener('input', clearErrors);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  clearErrors();
  if (fields.password.value !== fields.password_confirmation.value) {
    fields.password_confirmation.setCustomValidity('As senhas precisam ser iguais.');
    fields.password_confirmation.reportValidity();
    return;
  }
  const payload = Object.fromEntries(names.map(name => [name, fields.namedItem(name).value]));
  submit.disabled = true;
  submit.textContent = 'Criando conta…';
  form.setAttribute('aria-busy', 'true');
  // Impede mudanças nos campos enquanto estes mesmos valores estão sendo enviados.
  names.forEach(name => { fields.namedItem(name).readOnly = true; });
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) {
      showFeedback(result.error || 'Não foi possível cadastrar. Tente novamente.');
      const invalidNames = names.filter(name => Object.hasOwn(result.errors || {}, name));
      invalidNames.forEach(name => {
        const field = fields.namedItem(name);
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', `${field.id}-help Auth-signup-feedback`);
      });
      // Inclui as orientações do servidor sem interpretar HTML.
      if (invalidNames.length) {
        showFeedback(invalidNames.map(name => result.errors[name]).join(' '));
        fields.namedItem(invalidNames[0]).focus();
      } else feedback.focus();
      return;
    }
    if (response.status !== 201) throw new Error('Resposta inesperada.');
    document.getElementById('Auth-login-email').value = payload.email.trim();
    form.reset();
    showFeedback('Conta criada e salva no banco. Use o link Entrar para acessar sua conta.', true);
    feedback.focus();
  } catch {
    showFeedback('Não foi possível confirmar o cadastro. Confira sua conexão e tente novamente. Se a conta já tiver sido criada, o sistema avisará que o e-mail está cadastrado.');
    feedback.focus();
  } finally {
    names.forEach(name => { fields.namedItem(name).readOnly = false; });
    submit.disabled = false;
    submit.textContent = 'Criar conta';
    form.removeAttribute('aria-busy');
  }
});

// Só libera o envio depois que o código responsável pela API estiver carregado.
submit.disabled = false;
