// Dialog mantém o foco dentro do menu e oferece fechamento nativo com Escape.
export function mountMoreMenu() {
  const dialog = document.getElementById('more-menu');
  const trigger = document.getElementById('more-trigger');

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-menu-open');
  }

  function close() {
    if (dialog.open) dialog.close();
    // Atualiza imediatamente; o evento close pode ser entregue depois.
    trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu-open');
  }

  trigger.addEventListener('click', open);
  document.getElementById('more-close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  // Fecha o ciclo de Tab nos controles do menu, inclusive em navegadores que
  // permitem passar do último controle para a interface do próprio navegador.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('a[href], button:not([disabled])')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open) {
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-menu-open');
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
    if (event.target === dialog && outside) close();
  });
  dialog.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      close();
      // Mesmo destino não dispara hashchange: ainda assim, levar foco ao título.
      if (link.hash === window.location.hash) {
        document.querySelector(`${link.hash} h1`)?.focus({ preventScroll: true });
      }
    });
  });
  return { open, close };
}
