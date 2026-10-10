/*
 * Demo authentication (client-side only).
 * Good for a prototype; NOT secure for production — replace with a real
 * server-side login (sessions/JWT + hashed passwords in a database).
 */
const Auth = (() => {
  const SESSION = 'nl_admin_session', LOCK = 'nl_admin_lock', FAILS = 'nl_admin_fails';
  const TTL = 30 * 60 * 1000, MAX_FAILS = 5, LOCK_MS = 60 * 1000;
  const USER = 'admin', SALT = 'nagorik-ledger::';
  const HASH = { sha: 'ad0149bbdf26044e158db13a3de6f7803910fc6bfccbeea0062b833ed85c4769', fb: '14e7932466798b' };

  const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  };

  async function digest(pw) {
    const s = SALT + pw;
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return ['sha', [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')];
    }
    return ['fb', cyrb53(s)];
  }

  const get = () => { try { return JSON.parse(sessionStorage.getItem(SESSION)); } catch (e) { return null; } };
  const num = k => +localStorage.getItem(k) || 0;

  return {
    lockedFor: () => Math.max(0, Math.ceil((num(LOCK) - Date.now()) / 1000)),
    isLoggedIn() { const s = get(); return !!s && s.exp > Date.now(); },
    remaining() { const s = get(); return s ? s.exp - Date.now() : 0; },
    touch() { const s = get(); if (s && s.exp > Date.now()) { s.exp = Date.now() + TTL; sessionStorage.setItem(SESSION, JSON.stringify(s)); } },
    async login(user, pw) {
      const locked = this.lockedFor();
      if (locked) return { ok: false, locked };
      const [k, h] = await digest(pw);
      if (user.trim().toLowerCase() === USER && h === HASH[k]) {
        sessionStorage.setItem(SESSION, JSON.stringify({ user: USER, exp: Date.now() + TTL }));
        localStorage.removeItem(FAILS);
        return { ok: true };
      }
      const f = num(FAILS) + 1;
      if (f >= MAX_FAILS) { localStorage.setItem(LOCK, Date.now() + LOCK_MS); localStorage.setItem(FAILS, 0); return { ok: false, locked: LOCK_MS / 1000 }; }
      localStorage.setItem(FAILS, f);
      return { ok: false, left: MAX_FAILS - f };
    },
    guard() { if (!this.isLoggedIn()) { sessionStorage.removeItem(SESSION); location.replace('login.html'); } },
    logout(reason = 'out') { sessionStorage.removeItem(SESSION); location.replace('login.html?' + reason + '=1'); }
  };
})();
