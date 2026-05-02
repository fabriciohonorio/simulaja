// Cinematic Effects — drop-in JS
(function () {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // Reveal + zoom on enter via IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('cin-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  const observe = () => {
    document.querySelectorAll('.cin-reveal:not(.cin-in), .cin-zoom:not(.cin-in)').forEach((el) => io.observe(el));
  };
  observe();

  // Re-observe on SPA route changes
  const mo = new MutationObserver(() => observe());
  mo.observe(document.body, { childList: true, subtree: true });

  // Parallax & layer scenes via requestAnimationFrame
  let ticking = false;
  const update = () => {
    const sy = window.scrollY;
    const wh = window.innerHeight;

    document.querySelectorAll('.cin-parallax').forEach((c) => {
      const inner = c.querySelector('.cin-parallax-inner');
      if (!inner) return;
      const factor = parseFloat(c.dataset.cinFactor || '0.3');
      const rect = c.getBoundingClientRect();
      const offset = (rect.top - wh) * factor;
      inner.style.transform = `translate3d(0, ${-offset}px, 0)`;
    });

    document.querySelectorAll('.cin-scene').forEach((c) => {
      const back = c.querySelector('.cin-layer-back');
      const front = c.querySelector('.cin-layer-front');
      const rect = c.getBoundingClientRect();
      const progress = (wh - rect.top) / (wh + rect.height);
      const p = Math.max(0, Math.min(1, progress));
      if (back) back.style.transform = `translate3d(0, ${(p - 0.5) * 30}px, 0)`;
      if (front) front.style.transform = `translate3d(0, ${(p - 0.5) * -60}px, 0)`;
    });

    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // Tilt
  document.addEventListener('mousemove', (ev) => {
    document.querySelectorAll('.cin-tilt').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) {
        el.style.transform = '';
        return;
      }
      const max = parseFloat(el.dataset.cinTilt || '8');
      const x = (ev.clientX - rect.left) / rect.width - 0.5;
      const y = (ev.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
    });
  });
})();
