const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const heroVisual = document.querySelector('.hero-visual');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));

const serviceCards = [...document.querySelectorAll('.service-card')];
function setCardOpen(card, open, pin = false) {
  const trigger = card.querySelector('.card-trigger');
  const detail = card.querySelector('.service-detail');
  if (pin) card.classList.toggle('is-expanded', open);
  trigger?.setAttribute('aria-expanded', String(open));
  detail?.setAttribute('aria-hidden', String(!open));
  const detailText = detail?.querySelectorAll('.word-reveal') ?? [];
  detailText.forEach(item => item.classList.remove('is-visible'));
  if (open) requestAnimationFrame(() => detailText.forEach(item => item.classList.add('is-visible')));
}
serviceCards.forEach(card => {
  const trigger = card.querySelector('.card-trigger');
  card.addEventListener('pointerenter', () => setCardOpen(card, true));
  card.addEventListener('pointerleave', () => {
    if (!card.classList.contains('is-expanded')) setCardOpen(card, false);
  });
  card.addEventListener('focusin', () => setCardOpen(card, true));
  card.addEventListener('focusout', event => {
    if (!card.contains(event.relatedTarget) && !card.classList.contains('is-expanded')) setCardOpen(card, false);
  });
  trigger?.addEventListener('click', () => setCardOpen(card, !card.classList.contains('is-expanded'), true));
});
document.addEventListener('click', event => {
  if (!event.target.closest('.service-card')) serviceCards.forEach(card => {
    if (card.classList.contains('is-expanded')) setCardOpen(card, false, true);
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') serviceCards.forEach(card => {
    if (card.classList.contains('is-expanded')) setCardOpen(card, false, true);
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let framePending = false;
const mainRail = document.querySelector('#page-rail');
function moveHeroGlobe() {
  framePending = false;
  if (!heroVisual || reducedMotion.matches) return;
  const railTravel = Math.max(1, window.innerWidth * .48);
  const activeRail = heroRail || mainRail;
  const progress = activeRail
    ? Math.max(0, Math.min(1, activeRail.scrollLeft / railTravel))
    : Math.max(0, Math.min(1, window.scrollY / Math.max(1, window.innerHeight * .48)));
  heroVisual.style.setProperty('--hero-exit', `${-window.innerWidth * 1.5 * progress}px`);
  heroVisual.style.setProperty('--hero-opacity', `${1 - progress * .45}`);
  heroVisual.style.setProperty('--hero-scale', `${1 - progress * .25}`);
}
function scheduleHeroMove() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(moveHeroGlobe);
}
window.addEventListener('scroll', scheduleHeroMove, { passive: true });
window.addEventListener('resize', scheduleHeroMove);
reducedMotion.addEventListener?.('change', scheduleHeroMove);
const heroRail = document.querySelector('#story-rail');
heroRail?.addEventListener('scroll', scheduleHeroMove, { passive: true });
mainRail?.addEventListener('scroll', scheduleHeroMove, { passive: true });
moveHeroGlobe();

function splitWords(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
  let wordIndex = 0;
  textNodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
      } else {
        const word = document.createElement('span');
        word.className = 'word';
        word.style.setProperty('--word-index', Math.min(wordIndex++, 9));
        word.textContent = part;
        fragment.append(word);
      }
    });
    node.replaceWith(fragment);
  });
}

const textTargets = document.querySelectorAll([
  'header .wordmark', 'header .nav-links a', 'header .menu-toggle b', 'header .back-link',
  'main h1', 'main h2', 'main h3', 'main p', 'main a', 'main button', 'main label', 'main summary', 'main li', 'main th', 'main td',
  'main .hero-topline span', 'main .hero-bottom span', 'main .section-label span', 'main .story-hint',
  'main .visual-caption span', 'main .float-note', 'main .table-kicker span',
  'main .visual-head span', 'main .demand-rings b', 'main .ring-label',
  'main .value-note > span', 'main .value-path i', 'main .value-path b',
  'main .strategy-rings b', 'main .campaign-graphic > span', 'main .campaign-graphic b',
  'main .card-index', 'main .detail-kicker', 'main .service-tail span',
  'main .closing-kicker', 'main .closing-art span',
  '.success-dialog h2', '.success-dialog p', '.success-dialog button',
  'footer .wordmark', 'footer > span', 'footer > a', 'footer > small'
].join(','));
textTargets.forEach(element => {
  element.classList.add('reveal', 'word-reveal');
  splitWords(element);
});
document.documentElement.classList.add('motion-ready');

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }), { threshold: .08, rootMargin: '0px 4% 0px 4%' });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

const storyRail = document.querySelector('#story-rail');
const storyPanels = storyRail ? [...storyRail.querySelectorAll('.story-slide')] : [];
const storyProgress = document.querySelector('.story-progress span');
const storyPrevious = document.querySelector('[data-story-prev]');
const storyNext = document.querySelector('[data-story-next]');
let storyWheelLocked = false;
let storyFramePending = false;

function activeStoryIndex() {
  if (!storyRail || !storyPanels.length) return 0;
  let nearest = 0;
  let distance = Infinity;
  storyPanels.forEach((panel, index) => {
    const currentDistance = Math.abs(panel.offsetLeft - storyRail.scrollLeft);
    if (currentDistance < distance) {
      distance = currentDistance;
      nearest = index;
    }
  });
  return nearest;
}

function updateStoryControls() {
  storyFramePending = false;
  if (!storyPanels.length) return;
  const index = activeStoryIndex();
  if (storyProgress) storyProgress.style.setProperty('--story-progress', `${((index + 1) / storyPanels.length) * 100}%`);
  if (storyPrevious) storyPrevious.disabled = index === 0;
  if (storyNext) storyNext.disabled = index === storyPanels.length - 1;
}

function scheduleStoryControls() {
  if (storyFramePending) return;
  storyFramePending = true;
  requestAnimationFrame(updateStoryControls);
}

function goToStoryPanel(index) {
  if (!storyRail || !storyPanels.length) return;
  const target = Math.max(0, Math.min(index, storyPanels.length - 1));
  storyRail.scrollTo({ left: storyPanels[target].offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
}

if (storyRail && storyPanels.length) {
  storyRail.addEventListener('scroll', scheduleStoryControls, { passive: true });
  window.addEventListener('resize', scheduleStoryControls);

  storyRail.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.deltaY === 0) return;
    const index = activeStoryIndex();
    const panel = storyPanels[index];
    const canScrollPanel = panel.scrollHeight > panel.clientHeight + 2;
    const panelHasRoom = canScrollPanel && (event.deltaY > 0
      ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2
      : panel.scrollTop > 2);
    if (panelHasRoom) return;

    const direction = Math.sign(event.deltaY);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= storyPanels.length) return;
    event.preventDefault();
    if (storyWheelLocked) return;
    storyWheelLocked = true;
    goToStoryPanel(nextIndex);
    window.setTimeout(() => { storyWheelLocked = false; }, 650);
  }, { passive: false });

  storyPrevious?.addEventListener('click', () => goToStoryPanel(activeStoryIndex() - 1));
  storyNext?.addEventListener('click', () => goToStoryPanel(activeStoryIndex() + 1));

  document.querySelectorAll('.story-rail a[href^="#"], .site-header a[href^="#"], footer a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      const index = storyPanels.indexOf(target);
      if (index < 0) return;
      event.preventDefault();
      if (window.scrollY > 2) window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      goToStoryPanel(index);
      if (window.matchMedia('(max-width: 680px)').matches) {
        menuButton?.setAttribute('aria-expanded', 'false');
        nav?.classList.remove('open');
      }
    });
  });

  storyRail.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, select, button, a')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToStoryPanel(activeStoryIndex() + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToStoryPanel(activeStoryIndex() - 1);
    }
  });

  updateStoryControls();
}

const pageRail = document.querySelector('#page-rail');
const pagePanels = pageRail ? [...pageRail.querySelectorAll('.page-slide')] : [];
const pageControls = document.querySelector('.page-controls');
const pageProgress = pageControls?.querySelector('i');
let pageWheelLocked = false;
let pageWheelTimer = 0;
function activePagePanel() {
  if (!pageRail || !pagePanels.length) return 0;
  let selected = 0;
  let shortest = Infinity;
  pagePanels.forEach((panel, index) => {
    const distance = Math.abs(panel.offsetLeft - pageRail.scrollLeft);
    if (distance < shortest) { shortest = distance; selected = index; }
  });
  return selected;
}
function goToPagePanel(index) {
  if (!pageRail || !pagePanels.length) return;
  const selected = Math.max(0, Math.min(index, pagePanels.length - 1));
  pageRail.scrollTo({ left: pagePanels[selected].offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  if (pageProgress) pageProgress.style.width = `${((selected + 1) / pagePanels.length) * 100}%`;
  const previous = pageControls?.querySelector('[data-page-prev]');
  const next = pageControls?.querySelector('[data-page-next]');
  if (previous) previous.disabled = selected === 0;
  if (next) next.disabled = selected === pagePanels.length - 1;
}
if (pageRail && pagePanels.length) {
  pageRail.addEventListener('wheel', event => {
    const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : (event.shiftKey ? event.deltaY : 0);
    if (Math.abs(horizontalDelta) < 2) return;
    event.preventDefault();
    window.clearTimeout(pageWheelTimer);
    if (!pageWheelLocked) {
      pageWheelLocked = true;
      const next = activePagePanel() + Math.sign(horizontalDelta);
      if (next >= 0 && next < pagePanels.length) goToPagePanel(next);
    }
    // Treat a burst of wheel events as one intentional panel change.
    pageWheelTimer = window.setTimeout(() => { pageWheelLocked = false; }, 420);
  }, { passive: false });
  let dragStart = null;
  pageRail.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a, button, input, textarea, select, summary')) return;
    dragStart = { x: event.clientX, scrollLeft: pageRail.scrollLeft, panel: activePagePanel(), pointerId: event.pointerId, moved: false };
    pageRail.setPointerCapture(event.pointerId);
  });
  pageRail.addEventListener('pointermove', event => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragStart.x;
    if (Math.abs(distance) > 8) {
      pageRail.classList.add('is-dragging');
      dragStart.moved = true;
      event.preventDefault();
      const minPanel = Math.max(0, dragStart.panel - 1);
      const maxPanel = Math.min(pagePanels.length - 1, dragStart.panel + 1);
      const minScroll = pagePanels[minPanel].offsetLeft;
      const maxScroll = pagePanels[maxPanel].offsetLeft;
      pageRail.scrollLeft = Math.max(minScroll, Math.min(maxScroll, dragStart.scrollLeft - distance));
    }
  });
  const endDrag = () => {
    const shouldSnap = dragStart?.moved;
    dragStart = null;
    pageRail.classList.remove('is-dragging');
    if (shouldSnap) goToPagePanel(activePagePanel());
  };
  pageRail.addEventListener('pointerup', endDrag);
  pageRail.addEventListener('pointercancel', endDrag);
  pageRail.addEventListener('scroll', () => {
    const selected = activePagePanel();
    if (pageProgress) pageProgress.style.width = `${((selected + 1) / pagePanels.length) * 100}%`;
    const previous = pageControls?.querySelector('[data-page-prev]');
    const next = pageControls?.querySelector('[data-page-next]');
    if (previous) previous.disabled = selected === 0;
    if (next) next.disabled = selected === pagePanels.length - 1;
  }, { passive: true });
  pageControls?.querySelector('[data-page-prev]')?.addEventListener('click', () => goToPagePanel(activePagePanel() - 1));
  pageControls?.querySelector('[data-page-next]')?.addEventListener('click', () => goToPagePanel(activePagePanel() + 1));
  pageRail.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, select, button, a')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goToPagePanel(activePagePanel() + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToPagePanel(activePagePanel() - 1); }
  });
  pageRail.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const destination = document.querySelector(link.getAttribute('href'));
    const panelIndex = pagePanels.findIndex(panel => panel === destination || panel.contains(destination));
    if (panelIndex < 0) return;
    event.preventDefault();
    goToPagePanel(panelIndex);
    history.replaceState(null, '', link.getAttribute('href'));
    if (window.matchMedia('(max-width: 680px)').matches) {
      menuButton?.setAttribute('aria-expanded', 'false');
      nav?.classList.remove('open');
    }
  }));
  if (location.hash) {
    const target = document.querySelector(location.hash);
    const targetIndex = pagePanels.findIndex(panel => panel === target || panel.contains(target));
    if (targetIndex >= 0) requestAnimationFrame(() => goToPagePanel(targetIndex));
  }
  goToPagePanel(activePagePanel());
}

const offerDialog = document.querySelector('#offer-dialog');
const offerDialogTitle = document.querySelector('#offer-dialog-title');
const offerDialogContent = document.querySelector('#offer-dialog-content');
document.querySelectorAll('[data-offer]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    if (!offerDialog) return;
    const card = trigger.closest('.offer-card, .addon-card');
    const title = card?.querySelector('.offer-kicker, .addon-name')?.textContent.trim() || 'LOUDR SERVICE';
    const details = card?.querySelector('.offer-more');
    if (!details) return;
    offerDialogTitle.textContent = title;
    const detailCopy = details.cloneNode(true);
    detailCopy.hidden = false;
    offerDialogContent.replaceChildren(detailCopy);
    offerDialog.showModal();
  });
});
offerDialog?.querySelector('.dialog-close')?.addEventListener('click', () => offerDialog.close());
offerDialog?.addEventListener('click', event => {
  if (event.target === offerDialog) offerDialog.close();
});
