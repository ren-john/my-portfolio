import { clamp, FRONT_ANGLE, orbitPose, orbitTransition, rotationForProject, selectedProject, wrapIndex } from './orbitMath';

export function setupProjectOrbit(isReduced: () => boolean) {
  const section = document.querySelector<HTMLElement>('#projects')!;
  const stage = document.querySelector<HTMLElement>('.orbit-stage')!;
  const field = document.querySelector<HTMLElement>('#project-gallery')!;
  const cards = [...field.querySelectorAll<HTMLElement>('.film-card')];
  const buttons = cards.map(card => card.querySelector<HTMLButtonElement>('[data-project]')!);
  const names = cards.map(card => card.querySelector('h3')!.textContent!);
  const previous = document.querySelector<HTMLButtonElement>('#project-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#project-next')!;
  const dots = [...document.querySelectorAll<HTMLButtonElement>('[data-slide]')];
  const count = document.querySelector<HTMLElement>('#project-count')!;
  const selectedName = document.querySelector<HTMLElement>('#orbit-selected-name')!;
  const listToggle = document.querySelector<HTMLButtonElement>('#orbit-list-toggle')!;
  const dialog = document.querySelector<HTMLDialogElement>('#project-dialog')!;
  const controller = new AbortController();
  const { signal } = controller;
  let rotation = FRONT_ANGLE, tilt = 0, velocity = 0, target: number | null = null;
  let frame = 0, lastFrame = 0, active = false, ready = false, listView = false;
  let width = 0, height = 0, sectionTop = 0, travel = 0, scrollProgress = 0, selected = -1;
  let pointer: { id: number; x: number; y: number; lastX: number; time: number; hub: boolean; dragging: boolean } | null = null;
  let suppressClick = false;
  let dialogReturnY = 0, restoreFrame = 0;

  section.classList.add('orbit-ready');
  buttons.forEach((button, i) => button.setAttribute('aria-label', `View ${names[i]}`));

  function measure() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    sectionTop = section.getBoundingClientRect().top + window.scrollY;
    travel = Math.max(1, section.offsetHeight - height);
    updateScroll();
  }
  function syncSelection() {
    const index = selectedProject(rotation, cards.length);
    if (index === selected) return;
    selected = index;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    selectedName.textContent = names[index];
    cards.forEach((card, i) => card.classList.toggle('is-selected', i === index));
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  }
  function paint() {
    const state = orbitTransition(scrollProgress, width, height, isReduced() || listView);
    ready = state.ready;
    section.dataset.orbitReady = String(ready);
    document.body.classList.toggle('orbit-color-stage', active && window.scrollY >= sectionTop && state.intro > .01);
    stage.style.setProperty('--core-scale', String(state.scale));
    stage.style.setProperty('--orbit-reveal', String(state.reveal));
    stage.style.setProperty('--intro-opacity', String(state.intro));
    field.inert = !ready;
    stage.querySelector<HTMLElement>('.orbit-controls')!.inert = !ready;
    listToggle.disabled = !ready;
    cards.forEach((card, i) => {
      const pose = orbitPose(i, cards.length, rotation, tilt, width, height);
      const spread = 1 + (1 - state.reveal) * .32;
      card.style.setProperty('--orbit-x', `${pose.x * spread}px`);
      card.style.setProperty('--orbit-y', `${pose.y * spread}px`);
      card.style.setProperty('--orbit-scale', String(pose.scale));
      card.style.setProperty('--card-opacity', String(pose.opacity));
      card.style.setProperty('--card-blur', `${pose.blur}px`);
      card.style.zIndex = String(pose.zIndex);
    });
    syncSelection();
    buttons.forEach((button, i) => { button.tabIndex = listView || i === selected ? 0 : -1; });
  }
  function tick(time: number) {
    frame = 0;
    const delta = Math.min(32, time - (lastFrame || time - 16));
    lastFrame = time;
    if (!active || document.hidden || dialog.open) { velocity = 0; target = null; return; }
    if (target !== null) {
      rotation += (target - rotation) * (1 - Math.exp(-delta / 90));
      if (Math.abs(target - rotation) < .001) { rotation = target; target = null; }
    } else if (!pointer && Math.abs(velocity) > .00002 && !isReduced()) {
      rotation += velocity * delta;
      velocity *= Math.exp(-delta / 250);
    } else velocity = 0;
    paint();
    if (target !== null || velocity !== 0) frame = requestAnimationFrame(tick);
  }
  function requestTick() { if (!frame) { lastFrame = 0; frame = requestAnimationFrame(tick); } }
  function updateScroll() {
    scrollProgress = clamp((window.scrollY - sectionTop) / travel);
    active = window.scrollY + window.innerHeight > sectionTop && window.scrollY < sectionTop + section.offsetHeight;
    if (!active) { velocity = 0; target = null; cancelAnimationFrame(frame); frame = 0; }
    paint();
  }
  function select(index: number, immediate = false) {
    const destination = rotationForProject(index, cards.length, rotation);
    velocity = 0;
    if (isReduced() || listView || immediate) { rotation = destination; target = null; paint(); }
    else { target = destination; requestTick(); }
  }
  function openProject(index: number) {
    velocity = 0; target = null;
    dialogReturnY = listView || isReduced() ? window.scrollY : Math.max(window.scrollY, sectionTop + travel * .8);
    select(index, true);
    const template = document.querySelector<HTMLTemplateElement>(`#project-detail-${index}`)!;
    document.querySelector('#project-dialog-title')!.textContent = names[index];
    document.querySelector('#project-dialog-content')!.replaceChildren(template.content.cloneNode(true));
    dialog.showModal(); dialog.scrollTop = 0;
    window.scrollTo({ top: dialogReturnY, behavior: 'instant' });
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => openProject(index), { signal }));
  previous.addEventListener('click', () => select(selected - 1), { signal });
  next.addEventListener('click', () => select(selected + 1), { signal });
  dots.forEach((dot, index) => dot.addEventListener('click', () => select(index), { signal }));
  field.addEventListener('keydown', event => {
    if (event.target !== field) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      select(event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : selected + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === 'Enter') { event.preventDefault(); openProject(selected); }
  }, { signal });
  // Capture only after a drag starts, so clicking a project still opens its notes.
  stage.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (!ready || listView || event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('.orbit-controls, .orbit-list-toggle')) return;
    velocity = 0; target = null; suppressClick = false;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, time: event.timeStamp, hub: !!(event.target as HTMLElement).closest('.orbit-center'), dragging: false };
  }, { signal });
  stage.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (!pointer.dragging && Math.hypot(dx, dy) < 7) return;
    // A vertical touch swipe outside the hub continues normal page scrolling.
    if (!pointer.dragging && event.pointerType === 'touch' && !pointer.hub && Math.abs(dy) > Math.abs(dx)) { pointer = null; return; }
    if (!pointer.dragging) { pointer.dragging = true; stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging'); }
    const speed = .006;
    rotation += (event.clientX - pointer.lastX) * speed;
    tilt = clamp(tilt + (event.movementY || 0) * .0004, -.10, .10);
    velocity = clamp((event.clientX - pointer.lastX) * speed / Math.max(8, event.timeStamp - pointer.time), -.008, .008);
    pointer.lastX = event.clientX; pointer.time = event.timeStamp;
    event.preventDefault(); paint();
  }, { signal });
  function finishDrag(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dragged = pointer.dragging;
    if (event.timeStamp - pointer.time > 100 || event.type === 'pointercancel') velocity = 0;
    pointer = null; stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (dragged) { suppressClick = true; if (!isReduced()) requestTick(); }
  }
  stage.addEventListener('pointerup', finishDrag, { signal });
  stage.addEventListener('pointercancel', finishDrag, { signal });
  stage.addEventListener('lostpointercapture', () => { pointer = null; stage.classList.remove('is-dragging'); }, { signal });
  stage.addEventListener('click', event => {
    if (!suppressClick) return;
    suppressClick = false; event.preventDefault(); event.stopImmediatePropagation();
  }, { capture: true, signal });
  listToggle.addEventListener('click', () => {
    listView = !listView; velocity = 0; target = null;
    section.classList.toggle('orbit-list-view', listView);
    listToggle.setAttribute('aria-pressed', String(listView));
    listToggle.textContent = listView ? 'Orbit view ↗' : 'List view ≡';
    measure();
    window.scrollTo({ top: sectionTop + (listView || isReduced() ? 0 : travel * .8), behavior: 'instant' });
    updateScroll(); listToggle.focus({ preventScroll: true });
  }, { signal });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }, { signal });
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(restoreFrame);
    restoreFrame = requestAnimationFrame(() => {
      window.scrollTo({ top: dialogReturnY, behavior: 'instant' });
      updateScroll();
    });
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { velocity = 0; target = null; cancelAnimationFrame(frame); frame = 0; }
  }, { signal });
  const resize = new ResizeObserver(measure);
  resize.observe(stage); resize.observe(section);
  measure();
  return {
    updateScroll,
    select,
    reveal(index?: number) {
      measure();
      window.scrollTo({ top: sectionTop + (isReduced() || listView ? 0 : travel * .8), behavior: 'instant' });
      if (index !== undefined) select(wrapIndex(index, cards.length), true);
      updateScroll();
    },
    syncMotion() { velocity = 0; target = null; measure(); },
    dispose() { controller.abort(); resize.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(restoreFrame); },
  };
}
