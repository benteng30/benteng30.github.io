// Ben Teng portfolio: scroll effects
// 1) Reveal each object (card, fact, timeline entry) as it scrolls into view
// 2) Scroll progress bar, header state, active nav link
// 3) Timeline line that fills as you scroll, light parallax on the hero graphic
// 4) Cursor glow on project cards

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');

  // Stagger objects that sit together
  document.querySelectorAll('[data-stagger]').forEach(group => {
    group.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i * 110) + 'ms';
      // clear the delay after it plays so hover effects stay snappy
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(el => io.observe(el));
  }

  const header = document.querySelector('.site-header');
  const root = document.documentElement;
  const timeline = document.querySelector('.timeline');
  const heroArt = document.querySelector('.hero-art');
  let ticking = false;

  function update() {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    header.classList.toggle('scrolled', y > 8);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const progress = (window.innerHeight * 0.65 - r.top) / r.height;
      timeline.style.setProperty('--tl', Math.min(1, Math.max(0, progress)).toFixed(3));
    }

    if (heroArt && !reduceMotion && y < window.innerHeight) {
      heroArt.style.translate = '0 ' + (y * 0.08).toFixed(1) + 'px';
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  // Active nav link
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => s && navIO.observe(s));

  // Cursor glow on cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();
