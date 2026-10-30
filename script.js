(() => {
    'use strict';
  
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    /* ---------- Header + mobile menu ---------- */
    const header = $('#header');
    const toggle = $('.nav-toggle');
    const links = $('#nav-links');
  
    if (header) {
      const onScroll = () => header.classList.toggle('solid', scrollY > 40);
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  
    if (header && toggle && links) {
      const setMenu = open => {
        links.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open);
        header.classList.toggle('menu-open', open);
      };
      toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
      links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
      addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
      addEventListener('resize', () => { if (innerWidth > 1024) setMenu(false); });
    }
  
    /* ---------- Hero slideshow ---------- */
    const slides = $$('.slide');
    const dotsWrap = $('.dots');
    if (slides.length && dotsWrap) {
      let i = 0, timer;
      const dots = slides.map((_, n) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Slide ' + (n + 1));
        b.addEventListener('click', () => { go(n); restart(); });
        dotsWrap.appendChild(b);
        return b;
      });
      const go = n => {
        slides[i].classList.remove('is-active'); dots[i].classList.remove('is-active');
        i = (n + slides.length) % slides.length;
        slides[i].classList.add('is-active'); dots[i].classList.add('is-active');
      };
      const start = () => { if (!reduce && slides.length > 1) timer = setInterval(() => go(i + 1), 5500); };
      const restart = () => { clearInterval(timer); start(); };
      dots[0].classList.add('is-active');
      start();
      document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : restart());
    }
  
    /* ---------- Reveal on scroll ---------- */
    const revealTargets = $$('.pillar, .card, .steps li, .story, .cta').filter(el => !el.closest('.listing'));
    if ('IntersectionObserver' in window && !reduce) {
      revealTargets.forEach(el => el.classList.add('reveal'));
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }), { threshold: .15 });
      revealTargets.forEach(el => io.observe(el));
    }
  
    /* Count-up numbers (start when visible) */
    const counters = $$('[data-count]');
    const countUp = el => {
      const end = +el.dataset.count, dur = 1400, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window && !reduce) {
      counters.forEach(el => el.textContent = 0);
      const co = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); }
      }), { threshold: .6 });
      counters.forEach(el => co.observe(el));
    }
  
    /* ---------- Filter chips (stays + community) ---------- */
    const chips = $$('.chip[data-filter]');
    if (chips.length) {
      const items = $$('[data-region]');
      const count = $('#count');
      const apply = f => {
        let shown = 0;
        items.forEach(el => {
          const match = f === 'all' || el.dataset.region === f;
          el.hidden = !match;
          if (match) shown++;
        });
        chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.filter === f));
        if (count) count.textContent = `Showing ${shown} ${shown === 1 ? count.dataset.one : count.dataset.many}`;
      };
      chips.forEach(c => c.addEventListener('click', () => {
        const f = c.dataset.filter;
        apply(f);
        history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      }));
      const hash = location.hash.slice(1);
      apply(chips.some(c => c.dataset.filter === hash) ? hash : 'all');
    }
  
    /* ---------- Date inputs: no past dates; depart after arrive ---------- */
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    $$('input[type="date"]').forEach(d => { d.min = today; });
    const arrive = $('#from'), depart = $('#to');
    if (arrive && depart) {
      arrive.addEventListener('change', () => {
        depart.min = arrive.value || today;
        if (depart.value && depart.value < depart.min) depart.value = '';
      });
    }
  
    /* ---------- Plan page: prefill from the home search bar ---------- */
    const plan = $('form[data-prefill]');
    if (plan) {
      const q = new URLSearchParams(location.search);
      if (q.get('region') && plan.elements.places) plan.elements.places.value = q.get('region');
      if (q.get('from') && arrive) arrive.value = q.get('from');
      if (q.get('guests') && plan.elements.guests) {
        [...plan.elements.guests.options].forEach(o => { if (o.value === q.get('guests')) plan.elements.guests.value = o.value; });
      }
      const style = q.get('style');
      if (style) $$('input[name="interest"]', plan).forEach(c => { if (c.value === style) c.checked = true; });
    }
  
    /* ---------- Forms (Web3Forms) ---------- */
    $$('form[data-web3]').forEach(form => {
      const status = $('.form-status', form);
      const btn = $('button[type="submit"]', form);
      const label = btn.textContent;
      const thanks = $('.thanks', form.closest('.form-card'));
  
      form.addEventListener('submit', async e => {
        e.preventDefault();
        status.className = 'form-status';
        status.textContent = '';
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (form.elements.botcheck && form.elements.botcheck.checked) return;
  
        const data = new FormData(form);
        if ($('[name="interest"]', form)) data.set('interest', data.getAll('interest').join(', ') || 'Not specified');
        btn.disabled = true;
        btn.textContent = 'Sending…';
  
        try {
          const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: data
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.message || 'Request failed');
          form.hidden = true;
          thanks.hidden = false;
          thanks.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        } catch (err) {
          status.textContent = 'Something went wrong. Please try again, or email contact.escovia@gmail.com.';
          status.classList.add('error');
          btn.disabled = false;
          btn.textContent = label;
        }
      });
    });
  })();