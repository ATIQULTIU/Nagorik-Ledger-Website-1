(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  if (Auth.isLoggedIn()) { location.replace('dashboard.html'); return; }

  const form = $('#loginForm'), msg = $('#msg'), btn = $('#submit'), card = $('#card'), pass = $('#pass');
  const show = (t, cls = 'error') => { msg.textContent = t; msg.className = 'msg ' + cls; msg.hidden = false; };
  UI.init();

  const q = new URLSearchParams(location.search);
  if (q.has('out')) show('আপনি সফলভাবে লগআউট করেছেন।', '');
  if (q.has('expired')) show('নিষ্ক্রিয়তার কারণে সেশন শেষ হয়েছে। আবার লগইন করুন।');

  $('#toggle').addEventListener('click', e => {
    const on = pass.type === 'password';
    pass.type = on ? 'text' : 'password';
    e.currentTarget.textContent = on ? 'লুকান' : 'দেখান';
    e.currentTarget.setAttribute('aria-pressed', on);
  });

  let timer;
  function lockUI() {
    clearInterval(timer);
    const upd = () => {
      const s = Auth.lockedFor();
      if (!s) { clearInterval(timer); btn.disabled = false; msg.hidden = true; return; }
      btn.disabled = true; show(`অনেকবার ভুল চেষ্টা হয়েছে। ${bn(s)} সেকেন্ড পর আবার চেষ্টা করুন।`);
    };
    upd(); timer = setInterval(upd, 1000);
  }
  if (Auth.lockedFor()) lockUI();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (btn.disabled) return;
    const user = $('#user').value, pw = pass.value;
    if (!user.trim() || !pw) { show('ইউজারনেম ও পাসওয়ার্ড দুটিই দিন।'); return; }
    btn.disabled = true; btn.textContent = 'যাচাই হচ্ছে...';
    const r = await Auth.login(user, pw);
    if (r.ok) { btn.textContent = 'সফল ✓'; location.replace('dashboard.html'); return; }
    btn.textContent = 'লগইন'; btn.disabled = false;
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    pass.value = ''; pass.focus();
    if (r.locked) lockUI(); else show(`ইউজারনেম বা পাসওয়ার্ড ভুল। আর ${bn(r.left)}বার চেষ্টা করা যাবে।`);
  });
})();
