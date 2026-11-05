// O cookie HttpOnly é enviado pelo navegador. JavaScript não lê seu identificador.
let csrfToken;

export async function accountRequest(path, { method = 'GET', body } = {}) {
  const writing = method !== 'GET';
  const response = await fetch(path, {
    method, cache: 'no-store', signal: AbortSignal.timeout(10000),
    headers: writing ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken } : {},
    ...(writing ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  if (response.status === 401) {
    document.querySelector('.App-shell').hidden = true;
    window.location.replace('/views/pages/auth.html#auth-login');
    throw new Error('Sua sessão terminou. Entre novamente.');
  }
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Não foi possível concluir a operação.'), { fields: data.errors });
  return data;
}

export async function mountAccountSession() {
  const shell = document.querySelector('.App-shell');
  const status = document.getElementById('session-status');
  const retry = document.getElementById('session-retry');
  const buttons = [...document.querySelectorAll('[data-logout]')];
  let userId;

  function returnToLogin() {
    shell.hidden = true;
    document.getElementById('more-menu').close();
    window.location.replace('/views/pages/auth.html#auth-login');
  }

  async function refresh() {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (response.status === 401) { returnToLogin(); return false; }
      if (!response.ok) throw new Error('Consulta indisponível');
      const { user, csrfToken: token } = await response.json();
      // Outra aba pode trocar de conta. Recarregar também limpa a demonstração.
      if (userId !== undefined && userId !== user.id) { window.location.reload(); return false; }
      userId = user.id;
      csrfToken = token;
      document.querySelectorAll('[data-profile-name]').forEach(node => { node.textContent = user.name; });
      document.querySelectorAll('[data-profile-email]').forEach(node => { node.textContent = user.email; });
      document.getElementById('inicio-title').textContent = `Olá, ${user.name.split(' ')[0]}!`;
      status.hidden = true;
      shell.hidden = false;
      return true;
    } catch {
      shell.hidden = true;
      document.getElementById('more-menu').close();
      status.hidden = false;
      document.getElementById('session-message').textContent = 'Não foi possível consultar sua conta. Confira a conexão e tente novamente.';
      retry.hidden = false;
      return false;
    }
  }

  retry.addEventListener('click', () => window.location.reload());
  if (!await refresh()) return false;

  buttons.forEach(button => button.addEventListener('click', async () => {
    if (button.disabled) return;
    buttons.forEach(item => { item.disabled = true; });
    document.querySelectorAll('[data-logout-feedback]').forEach(node => { node.textContent = ''; });
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: '{}', signal: AbortSignal.timeout(10000),
      });
      if (response.ok || response.status === 401) { returnToLogin(); return; }
      throw new Error('Saída não confirmada');
    } catch {
      document.querySelectorAll('[data-logout-feedback]').forEach(node => {
        node.textContent = 'Não foi possível confirmar a saída. Confira a conexão ou recarregue a página e tente novamente.';
      });
    } finally { buttons.forEach(item => { item.disabled = false; }); }
  }));
  // Revalida ao voltar de outra aba ou de uma página guardada pelo navegador.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  return true;
}
