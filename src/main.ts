import { setupProjectOrbit } from './ui/projectOrbit';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let manuallyStatic = false;
try { manuallyStatic = localStorage.getItem('portfolio-static') === 'true'; } catch { /* Storage is optional. */ }
const staticMode = () => manuallyStatic || reducedMotion.matches;
const motionButton = document.querySelector<HTMLButtonElement>('#motion-toggle')!;
const header = document.querySelector<HTMLElement>('.site-header')!;
const hero = document.querySelector<HTMLElement>('.portrait-hero')!;
const progress = document.querySelector<HTMLElement>('.page-progress span')!;
const orbit = setupProjectOrbit(staticMode);
const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')];
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.site-header nav a')];
let frame = 0;

function updateScroll() {
  frame = 0;
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 32);
  const length = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${length > 0 ? Math.min(1, y / length) : 0})`;
  // Only the background moves; document scrolling always stays native.
  hero.style.setProperty('--portrait-shift', `${staticMode() ? 0 : Math.min(y, hero.offsetHeight) * 0.16}px`);
  hero.classList.toggle('is-offscreen', y >= hero.offsetHeight);
  orbit.updateScroll();
  const current = sections.filter(section => section.getBoundingClientRect().top <= 150).at(-1)?.id ?? 'home';
  navLinks.forEach(link => {
    if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleScroll() { if (!frame) frame = requestAnimationFrame(updateScroll); }
function syncMotion() {
  const off = staticMode();
  document.body.classList.toggle('static-mode', off);
  motionButton.setAttribute('aria-pressed', String(off));
  motionButton.disabled = reducedMotion.matches;
  motionButton.title = reducedMotion.matches ? 'Reduced motion follows your system settings' : off ? 'Turn on motion' : 'Turn off motion';
  motionButton.querySelector('.motion-label')!.textContent = off ? 'Motion off' : 'Motion on';
  orbit.syncMotion();
  scheduleScroll();
}
motionButton.addEventListener('click', () => {
  manuallyStatic = !manuallyStatic;
  try { localStorage.setItem('portfolio-static', String(manuallyStatic)); } catch { /* Storage is optional. */ }
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll);

// Existing project links remain valid within the new continuous page.
function followProjectHash() {
  const aliases: Record<string, number> = { '#babycue': 1, '#inventory': 2 };
  const index = aliases[location.hash];
  if (index !== undefined || location.hash === '#projects') orbit.reveal(index);
}
window.addEventListener('hashchange', followProjectHash);
window.addEventListener('pageshow', () => { followProjectHash(); scheduleScroll(); });
document.querySelectorAll<HTMLAnchorElement>('a[href="#projects"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    if (location.hash !== '#projects') history.pushState(null, '', '#projects');
    orbit.reveal();
    document.querySelector<HTMLElement>('#project-gallery')!.focus({ preventScroll: true });
  });
});

// Content remains visible without JavaScript or when reduced motion is requested.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-revealed');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
document.querySelector('#year')!.textContent = String(new Date().getFullYear());
syncMotion();
followProjectHash();
updateScroll();
window.addEventListener('pagehide', event => {
  if (!event.persisted) { revealObserver.disconnect(); orbit.dispose(); cancelAnimationFrame(frame); }
});
