(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const { esc, bn, CATS, COSTS } = Store;
  const { reduce, fine } = UI;

  /* ---------- loader ---------- */
  const queue = []; let loaded = false;
  const onLoaded = fn => (loaded ? fn() : queue.push(fn));
  const finish = () => { if (loaded) return; loaded = true; root.classList.add('loaded'); queue.forEach(f => f()); };
  addEventListener('load', () => setTimeout(finish, reduce ? 0 : 700));
  setTimeout(finish, 3000);

  /* ---------- options ---------- */
  const opt = v => `<option value="${esc(v)}">${esc(v)}</option>`;
  $('#category').insertAdjacentHTML('beforeend', CATS.map(opt).join(''));
  $('#formCategory').insertAdjacentHTML('beforeend', CATS.map(opt).join(''));
  $('#formAmount').insertAdjacentHTML('beforeend', COSTS.map(opt).join(''));

  /* ---------- reports ---------- */
  const grid = $('#reportGrid'), search = $('#search'), category = $('#category');
  function render() {
    const q = search.value.trim().toLowerCase(), c = category.value;
    const list = Store.approved().filter(r => (c === 'সব' || r.cat === c) && (!q || `${r.title} ${r.loc} ${r.cat} ${r.details}`.toLowerCase().includes(q)));
    grid.innerHTML = list.length
      ? list.map((r, i) => `<article class="report" style="--i:${i}"><span class="tag">${esc(r.cat)}</span><h3>${esc(r.title)}</h3><p>${esc(r.details)}</p><div class="meta"><span>${esc(r.loc)}</span><span>${esc(r.amount)}</span></div></article>`).join('')
      : '<p class="empty">কোনো মিল পাওয়া যায়নি। অন্য শব্দে খুঁজুন অথবা ফিল্টার বদলান।</p>';
    $('#resultCount').textContent = `${bn(list.length)}টি রিপোর্ট`;
  }
  search.addEventListener('input', render);
  category.addEventListener('change', render);

  /* ---------- stats + insight ---------- */
  function countUp(el) {
    const to = +el.dataset.count; el.dataset.done = '1';
    if (reduce || !to) { el.textContent = bn(to); return; }
    const t0 = performance.now(), d = 1400;
    (function f(t) { const p = Math.min((t - t0) / d, 1); el.textContent = bn(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  const counters = $$('[data-count]');
  function renderStats() {
    const l = Store.approved();
    const v = [l.length, new Set(l.map(r => r.cat)).size, new Set(l.map(r => r.loc)).size];
    counters.forEach((el, i) => { el.dataset.count = v[i]; el.textContent = bn(el.dataset.done ? v[i] : 0); });
  }
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  counters.forEach(el => cio.observe(el));

  function renderInsight() {
    const l = Store.approved(), total = l.length || 1;
    const rows = CATS.map(c => ({ c, n: l.filter(r => r.cat === c).length })).sort((a, b) => b.n - a.n);
    $('#topCat').textContent = l.length ? rows[0].c : '—';
    $('#topNote').textContent = l.length ? `${bn(rows[0].n)}টি অনুমোদিত রিপোর্ট` : 'এখনো কোনো রিপোর্ট নেই';
    $('#bars').innerHTML = rows.map(r => { const p = Math.round(r.n / total * 100); return `<div><span>${esc(r.c)}</span><i><b style="--w:${p}%"></b></i><strong>${bn(p)}%</strong></div>`; }).join('');
  }

  const refresh = () => { render(); renderStats(); renderInsight(); };
  refresh();
  addEventListener('storage', e => { if (e.key === Store.KEY) refresh(); }); // admin changes sync live

  /* ---------- reveal + scrollspy ---------- */
  onLoaded(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { threshold: .12 });
    $$('.reveal').forEach(el => io.observe(el));
  });
  const links = $$('nav a[href^="#"]');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  ['reports', 'data', 'process', 'about'].forEach(id => spy.observe($('#' + id)));

  /* ---------- scroll: progress bar + header ---------- */
  const bar = $('.progress'), header = $('.site-header'); let tick = false;
  function onScroll() {
    tick = false;
    const max = root.scrollHeight - root.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? root.scrollTop / max : 0})`;
    header.classList.toggle('scrolled', root.scrollTop > 40);
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- mobile nav ---------- */
  const nav = $('#nav'), toggle = $('.nav-toggle');
  const setNav = open => { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'); };
  toggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });

  /* ---------- modal ---------- */
  const modal = $('#modal'), form = $('#reportForm'), err = $('#formError'); let lastFocus = null;
  function openModal() { lastFocus = document.activeElement; setNav(false); modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); form.elements.title.focus(); }
  function closeModal() { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); err.hidden = true; if (lastFocus) lastFocus.focus(); }
  $$('.open-modal').forEach(b => b.addEventListener('click', openModal));
  $('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('mousedown', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('show')) return;
    if (e.key === 'Escape') return closeModal();
    if (e.key !== 'Tab') return;
    const f = $$('button,input,select,textarea', modal).filter(x => !x.disabled), a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d.details.trim().length < 20) { err.textContent = 'বিবরণ অন্তত ২০ অক্ষরের হতে হবে।'; err.hidden = false; form.elements.details.focus(); return; }
    Store.add({ cat: d.category, title: d.title, loc: d.location, details: d.details, amount: d.amount });
    form.reset(); closeModal();
    UI.toast('রিপোর্ট জমা হয়েছে। অ্যাডমিন অনুমোদন করলে এটি তালিকায় দেখা যাবে।');
  });

  /* ---------- motion extras ---------- */
  UI.init();
  const hero = $('.hero');
  if (fine && !reduce) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 2);
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 2);
    });
    grid.addEventListener('pointermove', e => {
      const c = e.target.closest('.report'); if (!c) return;
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', (px - .5) * 8 + 'deg'); c.style.setProperty('--rx', (.5 - py) * 8 + 'deg');
      c.style.setProperty('--gx', px * 100 + '%'); c.style.setProperty('--gy', py * 100 + '%');
    });
    grid.addEventListener('pointerout', e => {
      const c = e.target.closest('.report');
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
    });
  }
  if (!reduce) { // gently moving demo dashboard
    const vals = $$('.hero-card .signal b'), fills = $$('.hero-card .bar i'), base = [72, 58, 84];
    setInterval(() => vals.forEach((b, i) => {
      const v = Math.max(10, Math.min(98, base[i] + Math.round((Math.random() - .5) * 12)));
      b.textContent = bn(v) + '%'; fills[i].style.width = v + '%';
    }), 2600);
  }
})();
