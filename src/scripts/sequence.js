// A stable, manual sequence: no internal scroller, autoplay or moving photograph.
(() => {
  const panel = document.querySelector('.failure-panel');
  const track = document.querySelector('#failure-track');
  if (!panel || !track) return;
  const rows = [...track.children];
  const previous = panel.querySelector('.sequence-prev');
  const next = panel.querySelector('.sequence-next');
  const position = panel.querySelector('.sequence-position');
  const photograph = panel.querySelector('.challenge-image > img');
  let index = 0;
  function goTo(target) {
    index = Math.max(0, Math.min(rows.length - 1, target));
    rows.forEach((row, i) => {
      row.classList.toggle('is-active', i === index);
      row.inert = i !== index;
    });
    previous.disabled = index === 0;
    next.disabled = index === rows.length - 1;
    position.textContent = `${String(index + 1).padStart(2, '0')} / ${String(rows.length).padStart(2, '0')}`;
    const source = rows[index].dataset.imageSrc;
    if (photograph && source) {
      photograph.src = source;
      photograph.alt = rows[index].dataset.imageAlt;
    }
  }
  previous.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));
  track.addEventListener('keydown', event => {
    const keys = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: rows.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    goTo(keys[event.key]);
  });
  panel.classList.add('sequence-ready');
  goTo(0);
  // Warm the remaining local photographs only as the sequence approaches the
  // viewport. The hero remains the initial loading priority.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      rows.slice(1).forEach(row => {
        const image = new Image();
        image.src = row.dataset.imageSrc;
      });
      observer.disconnect();
    }, { rootMargin: '400px' });
    observer.observe(panel);
  }
})();
