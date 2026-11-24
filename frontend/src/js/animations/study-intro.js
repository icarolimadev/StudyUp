/** Times are milliseconds. Scale the whole sequence with speed (2 = twice as fast). */
export const INTRO = Object.freeze({
  speed: 1, duration: 8000, fall: 500, impact: 1650, activate: 1800,
  dawn: 3000, assemble: 4500, settle: 6500,
  particles: 12, particleDistance: 150, glow: 22,
});

const root = document.documentElement;
if (root.classList.contains('Study-intro')) startIntro();

function startIntro() {
  const animations = [];
  const temporary = [];
  const originals = [];
  const content = document.querySelector('.Study-content');
  const orbit = document.querySelector('.Study-orbit');
  const hero = document.querySelector('.Study-mark--hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  let finished = false;
  let skip;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clearTimeout(window.studyIntroWatchdog);
    const restoreFocus = document.activeElement === skip;
    root.classList.remove('Study-intro', 'Study-intro-ready');
    root.classList.add('Study-intro-complete');
    animations.forEach(animation => animation.cancel());
    temporary.forEach(node => node.remove());
    originals.forEach(([node, html]) => { node.innerHTML = html; });
    content?.removeAttribute('inert');
    window.removeEventListener('resize', finish);
    window.removeEventListener('pagehide', finish);
    window.removeEventListener('studyintro:abort', finish);
    reduced.removeEventListener('change', finish);
    try { sessionStorage.setItem('studyup:intro-seen', '1'); } catch { /* Optional storage. */ }
    if (restoreFocus) document.querySelector('.Study-start').focus({ preventScroll: true });
  }
  function node(tag, className, parent = document.body) {
    const element = document.createElement(tag);
    element.className = `${className} Study-intro-temporary`;
    parent.append(element);
    temporary.push(element);
    return element;
  }
  function animate(element, keyframes, start, duration, easing = 'cubic-bezier(.22,1,.36,1)') {
    const animation = element.animate(keyframes, {
      delay: start / INTRO.speed, duration: duration / INTRO.speed, easing, fill: 'both',
    });
    animations.push(animation);
    return animation;
  }
  function reveal(element, start, duration = 700) {
    animate(element, [
      { opacity: 0, transform: 'translateY(18px)', filter: 'blur(5px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ], start, duration);
  }
  try {
    if (!content || !orbit || !hero || !hero.animate) { finish(); return; }
    clearTimeout(window.studyIntroWatchdog);
    content.setAttribute('inert', '');
    timer = setTimeout(finish, INTRO.duration / INTRO.speed);
    window.addEventListener('resize', finish);
    window.addEventListener('pagehide', finish);
    window.addEventListener('studyintro:abort', finish);
    reduced.addEventListener('change', finish);
    const backdrop = node('div', 'Study-intro-backdrop', document.querySelector('.Study-shell'));
    const light = node('div', 'Study-intro-light', document.querySelector('.Study-shell'));
    backdrop.setAttribute('aria-hidden', 'true');
    light.setAttribute('aria-hidden', 'true');
    skip = node('button', 'Study-intro-skip');
    skip.type = 'button';
    skip.textContent = 'Pular animação';
    skip.addEventListener('click', finish, { once: true });
    reveal(skip, INTRO.fall, 350);

    const rect = orbit.getBoundingClientRect();
    const dx = innerWidth / 2 - (rect.left + rect.width / 2);
    const dy = innerHeight / 2 - (rect.top + rect.height / 2);
    animate(orbit, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], INTRO.assemble, 1600);
    const symbol = hero.querySelector('.Study-symbol');
    animate(symbol, [
      { opacity: 0, transform: `translate(-2px, ${-innerHeight / 2 - 100}px) rotate(-18deg) scale(.8)`, offset: 0 },
      { opacity: 1, offset: .12 },
      { opacity: 1, transform: 'translate(-2px, 4px) rotate(2deg) scale(1.04,.96)', offset: .82, easing: 'ease-out' },
      { opacity: 1, transform: 'translate(-2px, -17px) rotate(-1deg)', offset: .92 },
      { opacity: 1, transform: 'translate(-2px, -4px)' },
    ], INTRO.fall, INTRO.activate - INTRO.fall, 'cubic-bezier(.45,0,.85,.65)');
    animate(symbol, [
      { filter: 'drop-shadow(0 0 0px #fff)' },
      { filter: 'drop-shadow(0 0 6px #fff)', offset: .3 },
      { filter: 'drop-shadow(0 0 2px #fff)', offset: .5 },
      { filter: 'drop-shadow(0 0 9px #fff)', offset: .75 },
      { filter: 'drop-shadow(0 0 0px #fff)' },
    ], INTRO.activate, 1200, 'ease-in-out');
    animate(hero, [
      { backgroundColor: 'transparent', boxShadow: '0 0 0 transparent' },
      { backgroundColor: '#1b8963', boxShadow: `0 0 ${INTRO.glow}px rgb(27 137 99 / 45%)`, offset: .7 },
      { backgroundColor: '#1b8963', boxShadow: '0 26px 54px rgb(27 137 99 / 24%)' },
    ], INTRO.activate, 1200);
    reveal(hero.querySelector('.Study-plus'), INTRO.activate + 450, 650);

    const impact = node('div', 'Study-intro-impact', orbit);
    animate(impact, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: .65, offset: .15 }, { opacity: 0, transform: 'scale(2.5)' }], INTRO.impact, 1200);
    for (let i = 0; i < INTRO.particles; i++) {
      const angle = i / INTRO.particles * Math.PI * 2;
      const distance = INTRO.particleDistance * (.65 + (i % 3) * .15);
      const particle = node('i', 'Study-intro-particle', orbit);
      animate(particle, [
        { opacity: 0, transform: 'translate(0, 0) scale(.5)' },
        { opacity: .8, offset: .1 },
        { opacity: 0, transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 30}px) scale(0)` },
      ], INTRO.impact + i * 12, 1700);
    }
    animate(light, [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, offset: .35 }, { opacity: 1, transform: 'scale(1)' }], INTRO.dawn, 1500, 'ease-in-out');
    animate(backdrop, [{ opacity: 1 }, { opacity: 0 }], INTRO.dawn + 500, 1000);
    animate(light, [{ opacity: 1 }, { opacity: 0 }], INTRO.assemble, 700);
    // Reveal the exact existing page background underneath the radial light.
    root.classList.add('Study-intro-ready');
    const rings = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    rings.setAttribute('viewBox', '0 0 480 480');
    rings.classList.add('Study-intro-rings', 'Study-intro-temporary');
    rings.innerHTML = '<circle cx="240" cy="240" r="239.5" pathLength="1"/><circle cx="240" cy="240" r="178.5" pathLength="1"/>';
    orbit.prepend(rings);
    temporary.push(rings);
    rings.querySelectorAll('circle').forEach((circle, i) => {
      animate(circle, [{ strokeDasharray: '1', strokeDashoffset: '1', opacity: 0 }, { strokeDasharray: '1', strokeDashoffset: '0', opacity: 1 }], INTRO.dawn + i * 200, 1500);
    });
    animate(content, [{ opacity: 1 }, { opacity: 1 }], 0, INTRO.duration);
    reveal(document.querySelector('.Study-mark--brand'), INTRO.assemble + 200);
    const wordmark = document.querySelector('.Study-wordmark');
    originals.push([wordmark, wordmark.innerHTML]);
    wordmark.innerHTML = [...'StudyUp'].map((letter, i) => `<span class="Study-intro-letter${i > 4 ? ' Study-wordmark-accent' : ''}">${letter}</span>`).join('');
    wordmark.querySelectorAll('span').forEach((letter, i) => reveal(letter, INTRO.assemble + 300 + i * 65));
    let wordIndex = 0;
    document.querySelectorAll('.Study-title-line').forEach(line => {
      originals.push([line, line.innerHTML]);
      line.innerHTML = line.textContent.trim().split(/\s+/).map(word => `<span class="Study-intro-word">${word}</span>`).join(' ');
      line.querySelectorAll('span').forEach(word => reveal(word, INTRO.assemble + 600 + wordIndex++ * 95));
    });
    reveal(document.querySelector('.Study-description'), INTRO.assemble + 1100);
    animate(document.querySelector('.Study-start'), [{ opacity: 0, transform: 'translateY(12px) scale(.94)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], INTRO.assemble + 1400, INTRO.settle - INTRO.assemble - 1400);
  } catch (error) {
    finish();
    console.warn('StudyUp: abertura ignorada; navegação disponível.', error);
  }
}
