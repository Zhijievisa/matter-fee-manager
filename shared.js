/* Matter Fee Manager — shared logic (money, dates, statuses, totals, badges, demo data)
 * Where data lives (nothing is sent anywhere else):
 *   card   t.set('card',  'shared', 'fee', {...})   the staged fee schedule of each card
 *   board  t.set('board', 'shared', 'cfg', {...})   language, currency symbol, payment terms, templates
 * Trello limit: 4096 characters of serialized data per scope/visibility pair.
 */
(function (root) {
  'use strict';

  var MFM = { VERSION: '1.1.0', KEY: 'fee', CFG_KEY: 'cfg', SIZE_LIMIT: 3900 };
  var STR = root.MFM_STR || (typeof require === 'function' ? require('./i18n.js') : { en: {}, zh: {} });

  /* ---------- language and currency ---------- */
  MFM.lang = 'en';
  MFM.cur = '$';
  MFM.detectLang = function () {
    var l = String(root.locale || (root.navigator && root.navigator.language) || 'en').toLowerCase();
    return l.indexOf('zh') === 0 ? 'zh' : 'en';
  };
  MFM.useCfg = function (cfg) {
    MFM.lang = cfg && (cfg.lang === 'en' || cfg.lang === 'zh') ? cfg.lang : MFM.detectLang();
    MFM.cur = cfg && typeof cfg.cur === 'string' && cfg.cur ? cfg.cur : '$';
    return cfg;
  };
  // tr('key', a, b): looks up the string in the current language, falls back to English.
  MFM.tr = function (key) {
    var args = arguments;
    var table = STR[MFM.lang] || STR.en;
    var s;
    if (args[1] === 1 && table[key + '_1'] !== undefined) s = table[key + '_1'];
    else s = table[key];
    if (s === undefined) s = STR.en[key];
    if (s === undefined) return key;
    return s.replace(/\{(\d)\}/g, function (m, i) {
      var v = args[+i + 1];
      return v === undefined || v === null ? '' : String(v);
    });
  };
  MFM.statusLabel = function (s) { return MFM.tr('st' + s); };

  /* ---------- dates (stored as yyyy-mm-dd, shown in the browser's regional format) ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  MFM.today = function () { return iso(new Date()); };
  MFM.addDays = function (s, n) {
    var d = parseIso(s);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  MFM.daysBetween = function (a, b) {
    var x = parseIso(a), y = parseIso(b);
    if (!x || !y) return 0;
    return Math.round((y.getTime() - x.getTime()) / 86400000);
  };
  MFM.fmtDate = function (s) {
    var d = parseIso(s);
    if (!d) return '';
    try {
      var loc = (root.navigator && root.navigator.language) || undefined;
      return new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    } catch (e) {
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    }
  };

  /* ---------- money (stored as integer cents to avoid float errors) ---------- */
  MFM.parseMoney = function (v) {
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
    var s = String(v == null ? '' : v).replace(/[\s,，$＄€£¥]/g, '').replace(/^[A-Za-z]{1,3}(?=\d)/, '');
    if (s === '') return 0;
    var m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
    if (!m) return null;
    var cents = parseInt(m[1], 10) * 100;
    if (m[2]) cents += parseInt((m[2] + '0').slice(0, 2), 10);
    return cents;
  };
  MFM.fmtMoney = function (cents, short) {
    cents = Math.round(cents || 0);
    var neg = cents < 0;
    if (neg) cents = -cents;
    var whole = Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var c = cents % 100;
    var out = MFM.cur + whole + (short && c === 0 ? '' : '.' + pad(c));
    return neg ? '-' + out : out;
  };
  MFM.moneyInput = function (cents) {
    cents = Math.round(cents || 0);
    return Math.floor(cents / 100) + '.' + pad(cents % 100);
  };

  /* ---------- data shape ----------
   * fee   {v, rv, c?, st:[{i,n,a,s,r?,inv?,d?,dd?,bd?,pd?}]}
   *   rv  revision counter, bumped on every save (used to detect concurrent edits)
   *   c   contract total (cents, optional)        a  stage amount (cents)
   *   s   0 not started · 1 done, to invoice · 2 invoiced, unpaid · 3 paid
   *   r   amount received so far while s === 2 (part payment)
   *   d   payment due date   dd  date done   bd  date invoiced   pd  date paid
   */
  MFM.newId = function () { return Math.random().toString(36).slice(2, 8); };
  MFM.newStage = function (name, amount) { return { i: MFM.newId(), n: name || '', a: amount || 0, s: 0 }; };
  MFM.normalize = function (fee) {
    var out = { v: 1, rv: 0, st: [] };
    if (!fee || typeof fee !== 'object') return out;
    if (typeof fee.rv === 'number' && fee.rv > 0) out.rv = Math.floor(fee.rv);
    if (typeof fee.c === 'number' && fee.c > 0) out.c = Math.round(fee.c);
    (fee.st || []).forEach(function (s) {
      if (!s || typeof s !== 'object') return;
      var st = {
        i: s.i || MFM.newId(),
        n: String(s.n || ''),
        a: typeof s.a === 'number' && isFinite(s.a) && s.a > 0 ? Math.round(s.a) : 0,
        s: s.s === 1 || s.s === 2 || s.s === 3 ? s.s : 0
      };
      if (st.s === 2 && typeof s.r === 'number' && s.r > 0) st.r = Math.min(Math.round(s.r), st.a);
      ['inv', 'd', 'dd', 'bd', 'pd'].forEach(function (k) { if (s[k]) st[k] = String(s[k]); });
      out.st.push(st);
    });
    return out;
  };
  MFM.compact = function (fee) {
    var n = MFM.normalize(fee);
    n.st.forEach(function (s) { s.n = s.n.trim(); });
    return n;
  };
  // money still owed on a stage that has been invoiced
  MFM.owing = function (stage) { return stage.s === 2 ? stage.a - Math.min(stage.r || 0, stage.a) : stage.a; };

  MFM.defaultCfg = function () {
    return {
      lang: 'auto', cur: '$', terms: 7,
      tpls: [{ n: MFM.tr('tpl_name'), st: [{ n: MFM.tr('tpl_s1'), a: 0 }, { n: MFM.tr('tpl_s2'), a: 0 }, { n: MFM.tr('tpl_s3'), a: 0 }] }]
    };
  };
  MFM.cfg = function (raw) {
    if (!raw || typeof raw !== 'object') { MFM.useCfg(null); return MFM.defaultCfg(); }
    var terms = parseInt(raw.terms, 10);
    var out = {
      lang: raw.lang === 'en' || raw.lang === 'zh' ? raw.lang : 'auto',
      cur: typeof raw.cur === 'string' && raw.cur.trim() ? raw.cur.trim().slice(0, 4) : '$',
      terms: isFinite(terms) && terms >= 0 ? terms : 7,
      tpls: []
    };
    MFM.useCfg(out);
    (Array.isArray(raw.tpls) ? raw.tpls : MFM.defaultCfg().tpls).forEach(function (t) {
      if (!t || !t.n) return;
      out.tpls.push({ n: String(t.n), st: (t.st || []).map(function (s) { return { n: String(s.n || ''), a: Math.round(s.a || 0) }; }) });
    });
    return out;
  };
  MFM.fromTemplate = function (tpl) {
    return { v: 1, rv: 0, st: (tpl && tpl.st ? tpl.st : []).map(function (s) { return MFM.newStage(s.n, s.a); }) };
  };
  // template text: one stage per line, "Stage name | amount"
  MFM.parseTemplateLines = function (text) {
    var out = [], bad = [];
    String(text || '').split(/\r?\n/).forEach(function (line, idx) {
      line = line.trim();
      if (!line) return;
      var parts = line.split(/[|｜]/);
      var name = parts[0].trim();
      var amt = parts.length > 1 ? MFM.parseMoney(parts.slice(1).join('')) : 0;
      if (!name || amt === null) { bad.push(idx + 1); return; }
      out.push({ n: name, a: amt });
    });
    return { stages: out, badLines: bad };
  };
  MFM.templateToText = function (tpl) {
    return (tpl.st || []).map(function (s) { return s.n + ' | ' + MFM.moneyInput(s.a); }).join('\n');
  };

  /* ---------- status change: stamp dates automatically ---------- */
  MFM.setStatus = function (stage, to, cfg, today) {
    today = today || MFM.today();
    var terms = cfg && typeof cfg.terms === 'number' ? cfg.terms : 7;
    to = +to;
    if (to >= 1 && !stage.dd) stage.dd = today;
    if (to >= 2 && !stage.bd) stage.bd = today;
    if (to >= 2 && !stage.d) stage.d = MFM.addDays(stage.bd, terms);
    if (to >= 3 && !stage.pd) stage.pd = today;
    if (to < 3) delete stage.pd;
    if (to < 2) { delete stage.bd; delete stage.d; }
    if (to < 1) delete stage.dd;
    if (to !== 2) delete stage.r;
    stage.s = to;
    return stage;
  };

  /* ---------- per-stage timing note ---------- */
  MFM.stageNote = function (stage, today) {
    today = today || MFM.today();
    if (stage.s === 1) {
      var w = stage.dd ? MFM.daysBetween(stage.dd, today) : 0;
      return { kind: 'warn', days: w, text: w > 0 ? MFM.tr('note_done_wait', w) : MFM.tr('note_done_today') };
    }
    if (stage.s === 2) {
      if (!stage.d) return { kind: 'wait', days: 0, text: MFM.tr('note_nodue') };
      var late = MFM.daysBetween(stage.d, today);
      if (late > 0) return { kind: 'late', days: late, text: MFM.tr('note_late', late) };
      if (late === 0) return { kind: 'wait', days: 0, text: MFM.tr('note_today') };
      return { kind: 'wait', days: late, text: MFM.tr('note_in', -late) };
    }
    if (stage.s === 3) return { kind: 'ok', days: 0, text: stage.pd ? MFM.tr('note_paid_on', MFM.fmtDate(stage.pd)) : MFM.tr('note_paid') };
    return { kind: 'none', days: 0, text: '' };
  };

  /* ---------- totals ---------- */
  MFM.summarize = function (fee, today) {
    today = today || MFM.today();
    var f = MFM.normalize(fee);
    var r = { n: f.st.length, nPaid: 0, sum: 0, paid: 0, toInvoice: 0, awaiting: 0, overdue: 0, overdueDays: 0, notDue: 0, contract: f.c || null };
    f.st.forEach(function (s) {
      r.sum += s.a;
      if (s.s === 3) { r.paid += s.a; r.nPaid++; }
      else if (s.s === 2) {
        var owing = MFM.owing(s);
        r.paid += s.a - owing;
        r.awaiting += owing;
        var late = s.d ? MFM.daysBetween(s.d, today) : 0;
        if (late > 0 && owing > 0) { r.overdue += owing; if (late > r.overdueDays) r.overdueDays = late; }
      }
      else if (s.s === 1) r.toInvoice += s.a;
      else r.notDue += s.a;
    });
    r.receivable = r.toInvoice + r.awaiting;   // due now but not yet received
    r.total = r.contract !== null ? r.contract : r.sum;
    r.mismatch = r.contract !== null && r.contract !== r.sum;
    r.outstanding = r.sum - r.paid;            // contract balance still to collect
    return r;
  };

  /* ---------- card front badges ---------- */
  MFM.badges = function (fee, today) {
    if (!fee) return [];
    var r = MFM.summarize(fee, today);
    if (!r.n || r.sum === 0) return [];
    var out = [];
    if (r.overdue > 0) out.push({ text: MFM.tr('bd_over', MFM.fmtMoney(r.overdue, true), r.overdueDays), color: 'red' });
    if (r.awaiting - r.overdue > 0) out.push({ text: MFM.tr('bd_unpaid', MFM.fmtMoney(r.awaiting - r.overdue, true)), color: 'orange' });
    if (r.toInvoice > 0) out.push({ text: MFM.tr('bd_toinv', MFM.fmtMoney(r.toInvoice, true)), color: 'yellow' });
    if (!out.length) {
      if (r.paid === r.sum) out.push({ text: MFM.tr('bd_full', MFM.fmtMoney(r.sum, true)), color: 'green' });
      else out.push({ text: MFM.tr('bd_prog', MFM.fmtMoney(r.paid, true), MFM.fmtMoney(r.sum, true)) });
    }
    return out;
  };

  MFM.sizeOf = function (obj) { return JSON.stringify(obj).length; };

  /* ---------- who may see fee data ----------
   * Fee figures are shown only to signed-in members who can edit the board. This is a display rule,
   * not a security boundary: Trello "shared" plugin data is readable by anyone who can read the board.
   */
  MFM.canSee = function (t) {
    try {
      if (typeof t.isMemberSignedIn === 'function' && !t.isMemberSignedIn()) return false;
      var p = (t.getContext() || {}).permissions;
      if (p && p.board && p.board !== 'write') return false;
    } catch (e) { /* if the context is unavailable, fall through and show */ }
    return true;
  };

  /* ---------- tiny DOM helpers (textContent only, never HTML strings) ---------- */
  MFM.h = function (tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  };
  MFM.fill = function (el, kids) {
    el.replaceChildren.apply(el, (kids || []).filter(function (k) { return k !== null && k !== undefined && k !== false; }));
    return el;
  };
  MFM.applyTheme = function (t) {
    try {
      var ctx = t.getContext ? t.getContext() : null;
      var set = function (theme) { document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light'); };
      if (ctx && ctx.initialTheme) set(ctx.initialTheme);
      if (typeof t.subscribeToThemeChanges === 'function') t.subscribeToThemeChanges(set);
    } catch (e) { /* stay on the light theme if the theme API is unavailable */ }
  };

  /* ---------- Trello vs demo environment ---------- */
  MFM.inTrello = function () {
    return !!(root.TrelloPowerUp && root.location && root.location.hash && root.location.hash.length > 1);
  };
  MFM.getT = function () {
    if (MFM.inTrello()) return root.TrelloPowerUp.iframe();
    MFM.demo = true;
    return MFM.mockT();
  };

  // Fictional demo data, used only when a page is opened outside Trello.
  var mock = null;
  MFM.mockT = function () {
    if (mock) return mock;
    var today = MFM.today();
    var ago = function (n) { return MFM.addDays(today, -n); };
    var zh = MFM.detectLang() === 'zh';
    var N = zh
      ? { l1: '进行中', l2: '已交付', c: '示例客户 ', m: ' — 案件 ', none: '（无收费表）', s1: '签约 / 首期', s2: '初稿交付', s3: '正式递交', s4: '结案' }
      : { l1: 'In progress', l2: 'Delivered', c: 'Sample Client ', m: ' — Matter ', none: ' (no fee schedule)', s1: 'Deposit on engagement', s2: 'Draft delivered', s3: 'Filing lodged', s4: 'Completion' };
    var store = {
      board: {},
      lists: [{ id: 'l1', name: N.l1 }, { id: 'l2', name: N.l2 }],
      cards: [
        { id: 'c1', name: N.c + 'A' + N.m + '101', idList: 'l2' },
        { id: 'c2', name: N.c + 'B' + N.m + '102', idList: 'l1' },
        { id: 'c3', name: N.c + 'C' + N.m + '103', idList: 'l2' },
        { id: 'c4', name: N.c + 'D' + N.m + '104' + N.none, idList: 'l1' }
      ],
      fee: {
        c1: { v: 1, rv: 3, c: 660000, st: [
          { i: 'a1', n: N.s1, a: 165000, s: 3, inv: 'INV-0001', dd: ago(60), bd: ago(60), d: ago(53), pd: ago(58) },
          { i: 'a2', n: N.s2, a: 220000, s: 2, r: 100000, inv: 'INV-0002', dd: ago(21), bd: ago(20), d: ago(13) },
          { i: 'a3', n: N.s3, a: 165000, s: 1, dd: ago(3) },
          { i: 'a4', n: N.s4, a: 110000, s: 0 }
        ] },
        c2: { v: 1, rv: 2, st: [
          { i: 'b1', n: N.s1, a: 200000, s: 3, inv: 'INV-0003', dd: ago(30), bd: ago(30), d: ago(23), pd: ago(29) },
          { i: 'b2', n: N.s2, a: 250000, s: 2, inv: 'INV-0004', dd: ago(2), bd: ago(2), d: MFM.addDays(today, 5) },
          { i: 'b3', n: N.s4, a: 100000, s: 0 }
        ] },
        c3: { v: 1, rv: 2, st: [
          { i: 'd1', n: N.s1, a: 300000, s: 3, inv: 'INV-0005', dd: ago(90), bd: ago(90), d: ago(83), pd: ago(88) },
          { i: 'd2', n: N.s4, a: 300000, s: 3, inv: 'INV-0006', dd: ago(10), bd: ago(10), d: ago(3), pd: ago(5) }
        ] }
      }
    };
    var renderers = [];
    var fire = function () { renderers.forEach(function (fn) { setTimeout(fn, 0); }); };
    var cardId = function (scope) { return scope === 'card' ? 'c1' : scope; };
    var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
    mock = {
      _store: store,
      get: function (scope, vis, key, def) {
        var v = scope === 'board' ? store.board[key] : (store[key] || {})[cardId(scope)];
        return Promise.resolve(v === undefined ? def : clone(v));
      },
      set: function (scope, vis, key, value) {
        if (scope === 'board') store.board[key] = clone(value);
        else { store[key] = store[key] || {}; store[key][cardId(scope)] = clone(value); }
        fire();
        return Promise.resolve();
      },
      remove: function (scope, vis, key) {
        if (scope === 'board') delete store.board[key];
        else if (store[key]) delete store[key][cardId(scope)];
        fire();
        return Promise.resolve();
      },
      render: function (fn) { renderers.push(fn); return fn(); },
      cards: function () { return Promise.resolve(store.cards.slice()); },
      lists: function () { return Promise.resolve(store.lists.slice()); },
      getContext: function () { return { card: 'c1', permissions: { card: 'write', board: 'write' } }; },
      isMemberSignedIn: function () { return true; },
      sizeTo: function () { return Promise.resolve(); },
      showCard: function () { return Promise.resolve(); },
      closePopup: function () { return Promise.resolve(); },
      closeModal: function () { return Promise.resolve(); }
    };
    return mock;
  };

  root.MFM = MFM;
  if (typeof module !== 'undefined' && module.exports) module.exports = MFM;
})(typeof window !== 'undefined' ? window : globalThis);
