/* Synchronous, before paint. A watchdog restores the page if the module fails. */
(() => {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('studyup:intro-seen')) return;
  } catch { /* Storage can be unavailable; the introduction remains optional. */ }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('Study-intro');
  window.studyIntroWatchdog = setTimeout(() => {
    document.documentElement.classList.remove('Study-intro');
    document.querySelector('.Study-content')?.removeAttribute('inert');
    window.dispatchEvent(new Event('studyintro:abort'));
  }, 10000);
})();
