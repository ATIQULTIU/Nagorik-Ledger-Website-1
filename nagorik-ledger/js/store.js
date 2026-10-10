/* Shared data layer: reports are kept in localStorage (demo backend). */
const Store = (() => {
  const KEY = 'nl_reports_v1';
  const CATS = ['ভূমি', 'পরিবহন', 'স্বাস্থ্য', 'শিক্ষা'];
  const COSTS = ['৳০–১,০০০', '৳১,০০০–৫,০০০', '৳৫,০০০–১০,০০০', '৳১০,০০০+'];

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const clamp = (s, n) => String(s || '').trim().slice(0, n);

  const seed = () => [
    ['ভূমি', 'দলিল প্রক্রিয়ায় অতিরিক্ত অপেক্ষা', 'রাজশাহী', '৳৫,০০০–১০,০০০', 'দলিল নিবন্ধনের কাজে একাধিক দিন অপেক্ষা করতে হয়েছে এবং প্রক্রিয়ার ধাপ স্পষ্ট ছিল না।'],
    ['পরিবহন', 'রেজিস্ট্রেশন কিউ ও দীর্ঘ অপেক্ষা', 'ঢাকা', '৳১,০০০–৫,০০০', 'যানবাহন রেজিস্ট্রেশনের লাইনে কয়েক ঘণ্টা অপেক্ষা; সিরিয়াল নম্বরের কোনো ডিজিটাল ব্যবস্থা ছিল না।'],
    ['স্বাস্থ্য', 'সেবা পাওয়ার সময়ের অভিজ্ঞতা', 'চট্টগ্রাম', '৳১,০০০–৫,০০০', 'বহির্বিভাগে টিকিট নেওয়ার পর ডাক্তার দেখাতে প্রায় তিন ঘণ্টা সময় লেগেছে।'],
    ['ভূমি', 'রেকর্ড সংশোধনে বিলম্ব', 'রংপুর', '৳৫,০০০–১০,০০০', 'রেকর্ড সংশোধনের আবেদনের অগ্রগতি জানার কোনো সহজ উপায় পাওয়া যায়নি।'],
    ['শিক্ষা', 'সনদ সংগ্রহের অপেক্ষার অভিজ্ঞতা', 'বগুড়া', '৳০–১,০০০', 'সনদ সংগ্রহের জন্য নির্ধারিত দিনের পরও আরও দুই দিন ঘুরতে হয়েছে।'],
    ['পরিবহন', 'লাইসেন্স আবেদন প্রক্রিয়ার অভিজ্ঞতা', 'খুলনা', '৳১,০০০–৫,০০০', 'অনলাইনে আবেদন সহজ ছিল, তবে পরীক্ষার তারিখ পেতে অনেক দেরি হয়েছে।']
  ].map(([cat, title, loc, amount, details], i) => ({
    id: 'seed-' + (i + 1), status: 'approved', date: `2026-09-${String(20 - i * 2).padStart(2, '0')}T10:00:00.000Z`, cat, title, loc, amount, details
  }));

  const write = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { /* storage unavailable */ } };
  const read = () => {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d)) return d; } catch (e) { /* fall through */ }
    const s = seed(); write(s); return s;
  };

  return {
    KEY, CATS, COSTS, esc, bn,
    all: () => read().sort((a, b) => b.date.localeCompare(a.date)),
    approved() { return this.all().filter(r => r.status === 'approved'); },
    add(r) {
      const l = read();
      l.push({
        id: 'r-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        status: 'pending', date: new Date().toISOString(),
        cat: CATS.includes(r.cat) ? r.cat : CATS[0],
        title: clamp(r.title, 100), loc: clamp(r.loc, 60), details: clamp(r.details, 1000),
        amount: COSTS.includes(r.amount) ? r.amount : ''
      });
      write(l);
    },
    setStatus(id, status) { const l = read(), r = l.find(x => x.id === id); if (r) { r.status = status; write(l); } },
    remove(id) { write(read().filter(r => r.id !== id)); },
    reset() { write(seed()); }
  };
})();
