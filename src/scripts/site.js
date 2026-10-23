// Navigation is visible without JavaScript; native details keeps the submenu usable.
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const teamMenu = document.querySelector('#team-menu');
const teamSummary = teamMenu.querySelector('summary');
const header = document.querySelector('#site-header');

function closeNavigation() {
  navigation.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  teamMenu.open = false;
}

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  if (!open) teamMenu.open = false;
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (teamMenu.open) {
    teamMenu.open = false;
    teamSummary.focus();
  } else if (toggle.getAttribute('aria-expanded') === 'true') {
    closeNavigation();
    toggle.focus();
  }
});

document.addEventListener('click', event => {
  if (!event.target.closest('.team-group')) teamMenu.open = false;
  if (!event.target.closest('#site-header')) closeNavigation();
});

navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeNavigation();
});

window.matchMedia('(min-width: 1001px)').addEventListener('change', closeNavigation);

// Passive, frame-coalesced updates change only the header's colour and rule.
// Its dimensions and document position remain constant while scrolling.
let framePending = false;
function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 16);
  framePending = false;
}
window.addEventListener('scroll', () => {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateHeader);
}, { passive: true });
updateHeader();
