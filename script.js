// Ben Teng portfolio: scroll animations
// Every animation plays once, the first time its section scrolls into view.
// Visitors with "reduce motion" turned on see everything immediately.

(function () {
  /* ---------- 0. Always start at the top on reload ---------- */
  // Browsers (especially on phones) restore the old scroll position on reload,
  // and a #section in the address bar makes them jump there. On a reload we
  // clear the #section and go to the top. A first visit to a shared link
  // like /#projects still opens that section.
  const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const isReload = navEntry ? navEntry.type === 'reload' : (performance.navigation && performance.navigation.type === 1);
  if (isReload || !location.hash) {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    toTop();
    window.addEventListener('load', toTop);
    window.addEventListener('pageshow', e => { if (e.persisted) toTop(); });
  }

  // Menu links scroll smoothly without adding #section to the address bar
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      const target = id === '#top' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (id === '#top') window.scrollTo({ top: 0, behavior: 'smooth' });
      else target.scrollIntoView({ behavior: 'smooth' });
      if (id === '#main') target.focus({ preventScroll: true });
    });
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- 1. Split text for the hero and the section headings ---------- */
  // Name: one span per letter (screen readers still read "Ben Teng")
  document.querySelectorAll('.split-chars').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'char-wrap';
      wrap.setAttribute('aria-hidden', 'true');
      const c = document.createElement('span');
      c.className = 'char';
      c.style.setProperty('--i', i);
      c.textContent = ch === ' ' ? ' ' : ch;
      wrap.appendChild(c);
      el.appendChild(wrap);
    });
  });

  // Headline: one span per word, keeping the gradient on "data and AI"
  document.querySelectorAll('.split-words').forEach(el => {
    let i = 0;
    const out = document.createDocumentFragment();
    el.childNodes.forEach(node => {
      const isAccent = node.nodeType === 1 && node.classList.contains('accent-text');
      const text = node.textContent;
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'word' + (isAccent ? ' accent-text' : '');
        w.style.setProperty('--i', i++);
        w.textContent = part;
        out.appendChild(w);
      });
    });
    el.textContent = '';
    el.appendChild(out);
  });

  // Section headings rise out of a mask
  document.querySelectorAll('h2.mask').forEach(h => {
    const inner = document.createElement('span');
    inner.className = 'mask-inner';
    while (h.firstChild) inner.appendChild(h.firstChild);
    h.appendChild(inner);
  });

  // Skill chips pop in one after another
  document.querySelectorAll('.skill-box .chips').forEach(list => {
    [...list.children].forEach((li, i) => li.style.setProperty('--i', i));
  });

  // Stagger objects that sit together (glance tiles, cards, skill boxes)
  document.querySelectorAll('[data-stagger]').forEach(group => {
    group.querySelectorAll(':scope > .reveal').forEach((el, i) => {
      el.dataset.delay = i * 120;
      el.style.transitionDelay = (i * 120) + 'ms';
    });
  });

  /* ---------- 2. Play each object's entrance once ---------- */
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now() + 250, dur = 900;
    el.textContent = '0';
    const tick = now => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function show(el) {
    el.classList.add('visible');
    el.querySelectorAll('[data-count]').forEach(countUp);
    // after the entrance finishes, switch to quick hover transitions
    const wait = (parseInt(el.dataset.delay || 0, 10)) + 1300;
    setTimeout(() => { el.style.transitionDelay = ''; el.classList.add('settled'); }, reduceMotion ? 0 : wait);
  }

  const items = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(show);
  } else {
    // Objects that start clipped or turned sideways have no visible area yet,
    // so they watch their container instead of themselves.
    const watchParent = ['wipe'];
    const targets = new Map();
    items.forEach(el => {
      const t = watchParent.includes(el.dataset.anim) ? el.parentElement : el;
      if (!targets.has(t)) targets.set(t, []);
      targets.get(t).push(el);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          targets.get(entry.target).forEach(show);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((_, t) => io.observe(t));
  }

  // Hero text starts on load
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.split-chars, .split-words').forEach(el => el.classList.add('go'));
  }));

  /* ---------- 3. Scroll-linked effects ---------- */
  const header = document.querySelector('.site-header');
  const timeline = document.querySelector('.timeline');
  const jobs = timeline ? [...timeline.querySelectorAll('.job')] : [];
  const heroArt = document.querySelector('.hero-art');
  const bgNums = [...document.querySelectorAll('.bg-num')];
  let ticking = false;

  function update() {
    const y = window.scrollY, vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    header.classList.toggle('scrolled', y > 8);

    // Timeline line draws down; each dot lights when the line reaches it
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const lineLen = r.height - 20;
      const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * 0.7 - r.top) / r.height));
      timeline.style.setProperty('--tl', progress.toFixed(3));
      const filled = 10 + lineLen * progress;
      jobs.forEach(job => {
        const dotY = job.offsetTop + 24;
        if (filled >= dotY) job.classList.add('lit');
      });
    }

    if (!reduceMotion) {
      // Hero graphic drifts a little slower than the page
      if (heroArt && y < vh && window.innerWidth > 820) heroArt.style.translate = '0 ' + (y * 0.08).toFixed(1) + 'px';
      // Big section numbers move at a different speed for depth
      bgNums.forEach(n => {
        const r = n.parentElement.getBoundingClientRect();
        if (r.bottom > -200 && r.top < vh + 200) {
          n.style.setProperty('--py', ((r.top - vh * 0.5) * -0.18).toFixed(1) + 'px');
        }
      });
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
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => s && navIO.observe(s));
  }

  /* ---------- 4. Pointer effects (laptops/desktops only) ---------- */
  if (finePointer && !reduceMotion) {
    // Project cards tilt slightly toward the cursor
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (card.classList.contains('settled')) {
          card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-4px)`;
        }
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // Hero graphic tilts slightly toward the cursor
    const hero = document.querySelector('.hero');
    if (hero && heroArt) {
      hero.addEventListener('pointermove', e => {
        const r = heroArt.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        heroArt.style.transform = `perspective(1000px) rotateY(${(x * 6).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
      });
      hero.addEventListener('pointerleave', () => { heroArt.style.transform = ''; });
    }
  }
})();
