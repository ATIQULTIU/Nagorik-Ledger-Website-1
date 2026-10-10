(() => {
  'use strict';
  Auth.guard();
  const { esc, bn } = Store;
  const $ = s => document.querySelector(s);
  const LABEL = { pending: 'অপেক্ষমাণ', approved: 'অনুমোদিত', rejected: 'বাতিল' };
  let tab = 'all', q = '';
  UI.init();

  const fmt = d => { try { return bn(new Date(d).toLocaleDateString('en-GB')); } catch (e) { return ''; } };

  function draw() {
    const all = Store.all(), n = s => all.filter(r => r.status === s).length;
    const kp = [['মোট রিপোর্ট', all.length, 'all'], ['অপেক্ষমাণ', n('pending'), 'pending'], ['অনুমোদিত', n('approved'), 'approved'], ['বাতিল', n('rejected'), 'rejected']];
    $('#kpis').innerHTML = kp.map(([l, v, k], i) => `<button class="kpi ${k === tab ? 'on' : ''}" style="--i:${i}" data-tab="${k}" aria-pressed="${k === tab}"><span>${l}</span><strong>${bn(v)}</strong></button>`).join('');

    const list = all.filter(r => (tab === 'all' || r.status === tab) && (!q || `${r.title} ${r.loc} ${r.cat} ${r.details}`.toLowerCase().includes(q)));
    $('#rows').innerHTML = list.map((r, i) => {
      const id = esc(r.id);
      return `<tr style="--i:${i}">
        <td data-label="রিপোর্ট"><b>${esc(r.title)}</b><small>${esc(r.details)}</small></td>
        <td data-label="সেবা">${esc(r.cat)}</td>
        <td data-label="এলাকা">${esc(r.loc)}</td>
        <td data-label="তারিখ">${fmt(r.date)}</td>
        <td data-label="অবস্থা"><span class="badge ${esc(r.status)}">${LABEL[r.status] || ''}</span></td>
        <td class="acts">
          ${r.status !== 'approved' ? `<button class="mini ok" data-act="approved" data-id="${id}">অনুমোদন</button>` : ''}
          ${r.status !== 'rejected' ? `<button class="mini warn" data-act="rejected" data-id="${id}">বাতিল</button>` : ''}
          <button class="mini bad" data-act="delete" data-id="${id}">মুছুন</button>
        </td></tr>`;
    }).join('');
    $('#empty').hidden = !!list.length;
  }

  document.addEventListener('click', e => {
    Auth.touch();
    const k = e.target.closest('[data-tab]');
    if (k) { tab = k.dataset.tab; draw(); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'delete') {
      if (!confirm('এই রিপোর্টটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
      Store.remove(a.dataset.id); UI.toast('রিপোর্ট মুছে ফেলা হয়েছে।');
    } else {
      Store.setStatus(a.dataset.id, a.dataset.act);
      UI.toast(a.dataset.act === 'approved' ? 'রিপোর্ট অনুমোদিত হয়েছে।' : 'রিপোর্ট বাতিল করা হয়েছে।');
    }
    draw();
  });
  document.addEventListener('keydown', () => Auth.touch());

  $('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); });
  $('#export').addEventListener('click', () => {
    const u = URL.createObjectURL(new Blob([JSON.stringify(Store.all(), null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: u, download: 'nagorik-ledger-reports.json' });
    a.click(); URL.revokeObjectURL(u);
  });
  $('#reset').addEventListener('click', () => {
    if (confirm('সব রিপোর্ট মুছে ডেমো ডেটা ফিরিয়ে আনবেন?')) { Store.reset(); draw(); UI.toast('ডেমো ডেটা রিসেট হয়েছে।'); }
  });
  $('#logout').addEventListener('click', () => Auth.logout());
  addEventListener('storage', e => { if (e.key === Store.KEY) draw(); });

  function tick() {
    const ms = Auth.remaining();
    if (ms <= 0) { Auth.logout('expired'); return; }
    const s = Math.floor(ms / 1000);
    $('#timer').textContent = `সেশন ${bn(String(Math.floor(s / 60)).padStart(2, '0'))}:${bn(String(s % 60).padStart(2, '0'))}`;
  }
  setInterval(tick, 1000); tick(); draw();
})();
