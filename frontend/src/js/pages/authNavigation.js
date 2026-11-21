export  function authNavigation() {
   document.querySelectorAll('.Auth-panel').forEach(v => v.classList.remove('panel'));
  const target = document.getElementById('auth-' + name);
  if (target) {
    target.classList.add('panel');

  }
}