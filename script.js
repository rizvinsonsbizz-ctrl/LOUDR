const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
  nav?.classList.toggle('open', !open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  nav.classList.remove('open');
}));

const revealTargets = document.querySelectorAll('.hero-copy, .hero-art, .section-head, .division-card, .manifesto > *, .work-note > *, .closing-cta > *, .division-hero > *, .service-intro > *, .service-list article, .audience-band > *, .artist-note > *, .simple-hero > *, .about-statement > *, .principle-grid article, .about-honesty > *, .price-card, .addon-grid article, .free-card, .contact-intro > *, .contact-form-panel > *, .what-tile, .home-slide > .slide-kicker, .home-slide > .slide-copy, .home-slide > .slide-art, .home-slide > .hero-meta, .home-slide > .hero-bottom');
revealTargets.forEach((el, i) => {
  if (el.matches('.hero-copy,.simple-hero h1,.division-hero h1,.contact-intro h1')) el.dataset.revealDelay = '1';
  else if (i % 5 === 2) el.dataset.revealDelay = '2';
  el.setAttribute('data-reveal', '');
});
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  document.documentElement.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('is-visible'));
}

document.querySelectorAll('.price-card').forEach(card => {
  card.addEventListener('toggle', () => {
    if (card.open) document.querySelectorAll('.price-card').forEach(other => {
      if (other !== card) other.open = false;
    });
  });
});

const params = new URLSearchParams(location.search);
const inquiry = document.querySelector('[name="inquiry"]');
if (inquiry) {
  const offer = params.get('offer');
  const path = params.get('inquiry');
  const requested = offer === 'content-calendar' ? 'free-calendar'
    : offer === 'analytics-review' ? 'free-analytics'
    : path === 'brand' ? 'brand'
    : path === 'artist' ? 'artist' : '';
  if (requested) inquiry.value = requested;
}
const messageField = document.querySelector('[name="message"]');
const packageName = params.get('package');
if (messageField && packageName) messageField.value = `I’d like to know more about the ${packageName.replaceAll('-', ' ')} package.`;

// Desktop hover and keyboard focus reveal the two useful navigation pop-ups.
const navDropdowns = [...document.querySelectorAll('.nav-dropdown')];
const desktopNavigation = window.matchMedia('(min-width: 701px)');
navDropdowns.forEach(dropdown => {
  dropdown.addEventListener('pointerenter', () => { if (desktopNavigation.matches) dropdown.open = true; });
  dropdown.addEventListener('pointerleave', () => { if (desktopNavigation.matches && !dropdown.contains(document.activeElement)) dropdown.open = false; });
  dropdown.addEventListener('focusin', () => { if (desktopNavigation.matches) dropdown.open = true; });
  dropdown.addEventListener('focusout', event => { if (!dropdown.contains(event.relatedTarget)) dropdown.open = false; });
});
document.addEventListener('click', event => {
  navDropdowns.forEach(dropdown => { if (!dropdown.contains(event.target)) dropdown.open = false; });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') navDropdowns.forEach(dropdown => { dropdown.open = false; });
});

// Five Home chapters use horizontal trackpad/touch scrolling and one-step mouse-wheel navigation.
const homeRail = document.querySelector('#home-rail');
const homeSlides = homeRail ? [...homeRail.querySelectorAll('.home-slide')] : [];
const homeCount = document.querySelector('.home-count');
const homePrev = document.querySelector('[data-home-prev]');
const homeNext = document.querySelector('[data-home-next]');
const homeDots = [...document.querySelectorAll('[data-home-dot]')];
let homeIndex = 0;
let homeWheelLocked = false;
let homeWheelRemainder = 0;
function currentHomeIndex() {
  if (!homeRail || !homeSlides.length) return 0;
  return Math.max(0, Math.min(homeSlides.length - 1, Math.round(homeRail.scrollLeft / homeRail.clientWidth)));
}
function updateHomeControls() {
  if (!homeRail || !homeSlides.length) return;
  homeIndex = currentHomeIndex();
  if (homeCount) homeCount.textContent = `${homeIndex + 1} / ${homeSlides.length}`;
  if (homePrev) homePrev.disabled = homeIndex === 0;
  if (homeNext) homeNext.disabled = homeIndex === homeSlides.length - 1;
  homeDots.forEach((dot, index) => {
    if (index === homeIndex) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  scheduleGrowthEarth();
}
function goToHomeSlide(index) {
  if (!homeRail || !homeSlides.length) return;
  const next = Math.max(0, Math.min(homeSlides.length - 1, index));
  homeRail.scrollTo({ left: next * homeRail.clientWidth, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  homeIndex = next;
  updateHomeControls();
}
homePrev?.addEventListener('click', () => goToHomeSlide(currentHomeIndex() - 1));
homeNext?.addEventListener('click', () => goToHomeSlide(currentHomeIndex() + 1));
homeDots.forEach(dot => dot.addEventListener('click', () => goToHomeSlide(Number(dot.dataset.homeDot))));
homeRail?.addEventListener('scroll', updateHomeControls, { passive: true });
window.addEventListener('resize', updateHomeControls);
homeRail?.addEventListener('wheel', event => {
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0 || event.ctrlKey) return;
  const index = currentHomeIndex();
  if ((event.deltaY > 0 && index >= homeSlides.length - 1) || (event.deltaY < 0 && index <= 0)) return;
  event.preventDefault();
  if (homeWheelLocked) return;
  homeWheelRemainder += event.deltaY;
  if (Math.abs(homeWheelRemainder) < 42) return;
  const direction = homeWheelRemainder > 0 ? 1 : -1;
  homeWheelRemainder = 0;
  homeWheelLocked = true;
  goToHomeSlide(index + direction);
  window.setTimeout(() => { homeWheelLocked = false; }, 720);
}, { passive: false });
homeRail?.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = homeSlides.findIndex(slide => `#${slide.id}` === link.getAttribute('href'));
  if (target < 0) return;
  event.preventDefault();
  goToHomeSlide(target);
}));
homeRail?.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); goToHomeSlide(currentHomeIndex() + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); goToHomeSlide(currentHomeIndex() - 1); }
});

// As the first chapter gives way, the gold Earth travels left and clears the stage.
const growthHero = document.querySelector('.home-hero');
const growthEarth = growthHero?.querySelector('.hero-art');
function updateGrowthEarth() {
  if (!growthHero || !growthEarth || reduceMotion.matches) return;
  const span = Math.max(1, homeRail?.clientWidth || growthHero.offsetHeight);
  const progress = Math.max(0, Math.min(1, (homeRail?.scrollLeft || window.scrollY) / span));
  growthEarth.style.setProperty('--earth-x', `${-window.innerWidth * 1.32 * progress}px`);
  growthEarth.style.setProperty('--earth-scale', String(1 - progress * 0.1));
  growthEarth.style.setProperty('--earth-opacity', String((1 - progress * 0.9) * (window.innerWidth <= 700 ? 0.18 : 0.24)));
}
let earthFrame = 0;
function scheduleGrowthEarth() {
  if (earthFrame) return;
  earthFrame = requestAnimationFrame(() => {
    earthFrame = 0;
    if (reduceMotion.matches && growthEarth) {
      growthEarth.style.setProperty('--earth-x', '0px');
      growthEarth.style.setProperty('--earth-scale', '1');
      growthEarth.style.setProperty('--earth-opacity', window.innerWidth <= 700 ? '.18' : '.24');
      return;
    }
    updateGrowthEarth();
  });
}
homeRail?.addEventListener('scroll', scheduleGrowthEarth, { passive: true });
window.addEventListener('scroll', scheduleGrowthEarth, { passive: true });
window.addEventListener('resize', scheduleGrowthEarth);
reduceMotion.addEventListener?.('change', scheduleGrowthEarth);
updateHomeControls();
scheduleGrowthEarth();
