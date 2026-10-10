/* Shared UI helpers: toast, custom cursor, magnetic buttons. */
const UI = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  function toast(msg, type = 'ok') {
    let w = document.getElementById('toasts');
    if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.append(w); }
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' err' : '');
    t.textContent = msg;
    w.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 4200);
  }

  function cursor() {
    const dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cursor'; ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    document.documentElement.classList.add('has-cursor');
    let x = 0, y = 0, rx = 0, ry = 0;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.classList.toggle('hot', !!e.target.closest('a,button,input,select,textarea,.report,.kpi'));
    }, { passive: true });
    (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; ring.style.transform = `translate3d(${rx}px,${ry}px,0)`; requestAnimationFrame(loop); })();
  }

  function magnetic() {
    document.addEventListener('pointermove', e => {
      const b = e.target.closest('.btn'); if (!b || b.disabled) return;
      const r = b.getBoundingClientRect();
      b.style.setProperty('--tx', (e.clientX - r.left - r.width / 2) * .18 + 'px');
      b.style.setProperty('--ty', (e.clientY - r.top - r.height / 2) * .28 + 'px');
    });
    document.addEventListener('pointerout', e => {
      const b = e.target.closest && e.target.closest('.btn');
      if (b && !b.contains(e.relatedTarget)) { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); }
    });
  }

  return { reduce, fine, toast, init() { if (fine && !reduce) { cursor(); magnetic(); } } };
})();
