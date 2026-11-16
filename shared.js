/* Matter Fee Manager — shared logic (money, dates, statuses, totals, badges, demo data)
 * Where data lives:
 *   card   t.set('card',  'shared', 'fee', {...})   the staged fee schedule of each card
 *   board  t.set('board', 'shared', 'cfg', {...})   payment terms, stage templates
 * Trello limit: 4096 characters of serialized data per scope/visibility pair.
 */
(function (root) {
  'use strict';

  var MFM = {};
  MFM.KEY = 'fee';
  MFM.CFG_KEY = 'cfg';
  MFM.SIZE_LIMIT = 3900; // headroom below 4096

  // Status: 0 not started → 1 done, to invoice → 2 invoiced, unpaid → 3 paid
  MFM.STATUS = [
    { id: 0, label: 'Not started', cls: 's0' },
    { id: 1, label: 'Done · to invoice', cls: 's1' },
    { id: 2, label: 'Invoiced · unpaid', cls: 's2' },
    { id: 3, label: 'Paid', cls: 's3' }
  ];

  MFM.DEFAULT_CFG = {
    terms: 7,
    tpls: [
      {
        n: 'Three-stage example (fill in amounts)',
        st: [
          { n: 'Engagement / first instalment', a: 0 },
          { n: 'Application lodged', a: 0 },
          { n: 'Grant / file closed', a: 0 }
        ]
      }
    ]
  };

  /* ---------- dates ---------- */
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
    return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : '';
  };

  /* ---------- money (stored as integer cents to avoid float errors) ---------- */
  MFM.parseMoney = function (v) {
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
    var s = String(v == null ? '' : v).replace(/[\s,，$＄]/g, '').replace(/^(AUD|A)/i, '');
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
    var dollars = Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var c = cents % 100;
    var out = '$' + dollars + (short && c === 0 ? '' : '.' + pad(c));
    return neg ? '-' + out : out;
  };
  MFM.moneyInput = function (cents) {
    cents = Math.round(cents || 0);
    return Math.floor(cents / 100) + '.' + pad(cents % 100);
  };

  /* ---------- data shape ---------- */
  MFM.newId = function () {
    return Math.random().toString(36).slice(2, 8);
  };
  MFM.newStage = function (name, amount) {
    return { i: MFM.newId(), n: name || '', a: amount || 0, s: 0 };
  };
  // normalise whatever was stored into {v, c?, st:[{i,n,a,s,inv,d,dd,bd,pd}]}
  MFM.normalize = function (fee) {
    var out = { v: 1, st: [] };
    if (!fee || typeof fee !== 'object') return out;
    if (typeof fee.c === 'number' && fee.c > 0) out.c = Math.round(fee.c);
    (fee.st || []).forEach(function (s) {
      if (!s || typeof s !== 'object') return;
      var st = {
        i: s.i || MFM.newId(),
        n: String(s.n || ''),
        a: typeof s.a === 'number' && isFinite(s.a) ? Math.round(s.a) : 0,
        s: s.s === 1 || s.s === 2 || s.s === 3 ? s.s : 0
      };
      ['inv', 'd', 'dd', 'bd', 'pd'].forEach(function (k) { if (s[k]) st[k] = String(s[k]); });
      out.st.push(st);
    });
    return out;
  };
  // drop empty fields before saving to save characters
  MFM.compact = function (fee) {
    var n = MFM.normalize(fee);
    n.st.forEach(function (s) { s.n = s.n.trim(); });
    return n;
  };
  MFM.cfg = function (raw) {
    var d = MFM.DEFAULT_CFG;
    if (!raw || typeof raw !== 'object') return JSON.parse(JSON.stringify(d));
    var terms = parseInt(raw.terms, 10);
    var out = { terms: isFinite(terms) && terms >= 0 ? terms : d.terms, tpls: [] };
    (Array.isArray(raw.tpls) ? raw.tpls : d.tpls).forEach(function (t) {
      if (!t || !t.n) return;
      out.tpls.push({
        n: String(t.n),
        st: (t.st || []).map(function (s) { return { n: String(s.n || ''), a: Math.round(s.a || 0) }; })
      });
    });
    return out;
  };
  MFM.fromTemplate = function (tpl) {
    return { v: 1, st: (tpl && tpl.st ? tpl.st : []).map(function (s) { return MFM.newStage(s.n, s.a); }) };
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
    var terms = cfg && typeof cfg.terms === 'number' ? cfg.terms : MFM.DEFAULT_CFG.terms;
    to = +to;
    if (to >= 1 && !stage.dd) stage.dd = today;                 // date work completed
    if (to >= 2 && !stage.bd) stage.bd = today;                 // invoice date
    if (to >= 2 && !stage.d) stage.d = MFM.addDays(stage.bd, terms); // payment due date
    if (to >= 3 && !stage.pd) stage.pd = today;                 // date paid
    if (to < 3) delete stage.pd;
    if (to < 2) { delete stage.bd; delete stage.d; }
    if (to < 1) delete stage.dd;
    stage.s = to;
    return stage;
  };

  /* ---------- per-stage timing note ---------- */
  MFM.stageNote = function (stage, today) {
    today = today || MFM.today();
    if (stage.s === 1) {
      var w = stage.dd ? MFM.daysBetween(stage.dd, today) : 0;
      return { kind: 'warn', days: w, text: w > 0 ? 'Done ' + w + 'd ago, not invoiced' : 'Done today, to invoice' };
    }
    if (stage.s === 2) {
      if (!stage.d) return { kind: 'wait', days: 0, text: 'No due date set' };
      var late = MFM.daysBetween(stage.d, today);
      if (late > 0) return { kind: 'late', days: late, text: late + (late === 1 ? ' day' : ' days') + ' overdue' };
      if (late === 0) return { kind: 'wait', days: 0, text: 'Due today' };
      return { kind: 'wait', days: late, text: 'Due in ' + (-late) + (late === -1 ? ' day' : ' days') };
    }
    if (stage.s === 3) return { kind: 'ok', days: 0, text: stage.pd ? 'Paid ' + MFM.fmtDate(stage.pd) : 'Paid' };
    return { kind: 'none', days: 0, text: '' };
  };

  /* ---------- totals ---------- */
  MFM.summarize = function (fee, today) {
    today = today || MFM.today();
    var f = MFM.normalize(fee);
    var r = {
      n: f.st.length, nPaid: 0,
      sum: 0,        // sum of all stages
      paid: 0,       // paid
      toInvoice: 0,  // done, to invoice
      awaiting: 0,   // invoiced, unpaid (incl. overdue)
      overdue: 0,    // of which overdue
      overdueDays: 0,
      notDue: 0,     // not started
      contract: f.c || null
    };
    f.st.forEach(function (s) {
      r.sum += s.a;
      if (s.s === 3) { r.paid += s.a; r.nPaid++; }
      else if (s.s === 2) {
        r.awaiting += s.a;
        var late = s.d ? MFM.daysBetween(s.d, today) : 0;
        if (late > 0) { r.overdue += s.a; if (late > r.overdueDays) r.overdueDays = late; }
      }
      else if (s.s === 1) r.toInvoice += s.a;
      else r.notDue += s.a;
    });
    r.receivable = r.toInvoice + r.awaiting;        // due now but not yet received
    r.total = r.contract !== null ? r.contract : r.sum;
    r.mismatch = r.contract !== null && r.contract !== r.sum;
    r.outstanding = r.sum - r.paid;                 // contract balance still to collect
    return r;
  };

  /* ---------- card front badges ---------- */
  MFM.badges = function (fee, today) {
    if (!fee) return [];
    var r = MFM.summarize(fee, today);
    if (!r.n) return [];
    var out = [];
    if (r.overdue > 0) out.push({ text: 'Overdue ' + MFM.fmtMoney(r.overdue, true) + ' · ' + r.overdueDays + 'd', color: 'red' });
    if (r.awaiting - r.overdue > 0) out.push({ text: 'Unpaid ' + MFM.fmtMoney(r.awaiting - r.overdue, true), color: 'orange' });
    if (r.toInvoice > 0) out.push({ text: 'To invoice ' + MFM.fmtMoney(r.toInvoice, true), color: 'yellow' });
    if (!out.length) {
      if (r.sum > 0 && r.paid === r.sum) out.push({ text: 'Paid in full ' + MFM.fmtMoney(r.sum, true), color: 'green' });
      else out.push({ text: 'Paid ' + MFM.fmtMoney(r.paid, true) + ' / ' + MFM.fmtMoney(r.sum, true) });
    }
    return out;
  };

  MFM.sizeOf = function (obj) { return JSON.stringify(obj).length; };

  /* ---------- tiny DOM helper (textContent only, no HTML strings) ---------- */
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

  // replace children (null / false are skipped)
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

  // fictional demo data (not real clients), used only when a page is opened outside Trello
  var mock = null;
  MFM.mockT = function () {
    if (mock) return mock;
    var today = MFM.today();
    var ago = function (n) { return MFM.addDays(today, -n); };
    var store = {
      board: { cfg: JSON.parse(JSON.stringify(MFM.DEFAULT_CFG)) },
      lists: [{ id: 'l1', name: 'Preparing' }, { id: 'l2', name: 'Lodged' }],
      cards: [
        { id: 'c1', name: 'Sample Client A — 482', idList: 'l2' },
        { id: 'c2', name: 'Sample Client B — 820', idList: 'l1' },
        { id: 'c3', name: 'Sample Client C — 186', idList: 'l2' },
        { id: 'c4', name: 'Sample Client D — 600 (no fee schedule)', idList: 'l1' }
      ],
      fee: {
        c1: { v: 1, c: 660000, st: [
          { i: 'a1', n: 'Engagement / first instalment', a: 165000, s: 3, inv: 'INV-0001', dd: ago(60), bd: ago(60), d: ago(53), pd: ago(58) },
          { i: 'a2', n: 'SBS + Nomination lodged', a: 220000, s: 2, inv: 'INV-0002', dd: ago(21), bd: ago(20), d: ago(13) },
          { i: 'a3', n: 'Visa application lodged', a: 165000, s: 1, dd: ago(3) },
          { i: 'a4', n: 'Grant / file closed', a: 110000, s: 0 }
        ] },
        c2: { v: 1, st: [
          { i: 'b1', n: 'Engagement / first instalment', a: 200000, s: 3, inv: 'INV-0003', dd: ago(30), bd: ago(30), d: ago(23), pd: ago(29) },
          { i: 'b2', n: 'Application lodged', a: 250000, s: 2, inv: 'INV-0004', dd: ago(2), bd: ago(2), d: MFM.addDays(today, 5) },
          { i: 'b3', n: 'Grant', a: 100000, s: 0 }
        ] },
        c3: { v: 1, st: [
          { i: 'd1', n: 'Engagement / first instalment', a: 300000, s: 3, inv: 'INV-0005', dd: ago(90), bd: ago(90), d: ago(83), pd: ago(88) },
          { i: 'd2', n: 'Grant / file closed', a: 300000, s: 3, inv: 'INV-0006', dd: ago(10), bd: ago(10), d: ago(3), pd: ago(5) }
        ] }
      }
    };
    var renderers = [];
    var fire = function () { renderers.forEach(function (fn) { setTimeout(fn, 0); }); };
    var cardId = function (scope) { return scope === 'card' ? 'c1' : scope; };
    mock = {
      _store: store,
      get: function (scope, vis, key, def) {
        var v;
        if (scope === 'board') v = store.board[key];
        else v = (store[key] || {})[cardId(scope)];
        return Promise.resolve(v === undefined ? def : JSON.parse(JSON.stringify(v)));
      },
      set: function (scope, vis, key, value) {
        if (scope === 'board') store.board[key] = JSON.parse(JSON.stringify(value));
        else { store[key] = store[key] || {}; store[key][cardId(scope)] = JSON.parse(JSON.stringify(value)); }
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
      sizeTo: function () { return Promise.resolve(); },
      showCard: function (id) { window.console && console.log('[demo] open card', id); return Promise.resolve(); },
      closePopup: function () { return Promise.resolve(); },
      closeModal: function () { return Promise.resolve(); }
    };
    return mock;
  };

  root.MFM = MFM;
  if (typeof module !== 'undefined' && module.exports) module.exports = MFM;
})(typeof window !== 'undefined' ? window : globalThis);
