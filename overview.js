/* Matter Fee Manager — board-level receivables overview (modal opened from the board button) */
(function () {
  'use strict';
  var MFM = window.MFM, h = MFM.h, tr = MFM.tr;

  function csvCell(v) {
    var s = String(v === undefined || v === null ? '' : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;           // stop spreadsheet apps treating text as a formula
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  MFM.toCsv = function (rows) {
    var lines = [tr('csv_head')];
    rows.forEach(function (x) {
      if (!x.fee) return;
      x.fee.st.forEach(function (s) {
        var owing = s.s === 3 ? 0 : MFM.owing(s);
        lines.push([
          x.card.name, x.list, s.n, MFM.moneyInput(s.a), MFM.moneyInput(s.a - owing), MFM.moneyInput(owing),
          MFM.statusLabel(s.s), s.inv || '', s.d || '', s.pd || '', s.dd || '', s.bd || ''
        ].map(csvCell).join(','));
      });
    });
    return lines.join('\n');
  };

  MFM.mountOverview = function (t, root) {
    var showCsv = false, copied = false, lastRows = [], cfg = null, syncMsg = '', syncBusy = false;

    function load() {
      return Promise.all([
        t.cards('id', 'name', 'idList'), t.lists('id', 'name'), t.get('board', 'shared', MFM.CFG_KEY)
      ]).then(function (r) {
        cfg = MFM.cfg(r[2]);
        if (!MFM.canSee(t)) { lastRows = []; MFM.fill(root, [h('div', { class: 'note info', text: tr('no_access') })]); return null; }
        var cards = r[0] || [], lists = {};
        (r[1] || []).forEach(function (l) { lists[l.id] = l.name; });
        return Promise.all(cards.map(function (c) {
          return t.get(c.id, 'shared', MFM.KEY).then(function (fee) {
            return { card: c, list: lists[c.idList] || '', fee: fee ? MFM.normalize(fee) : null };
          }, function () {
            return { card: c, list: lists[c.idList] || '', fee: null };
          });
        }));
      }).then(function (rows) { if (rows) { lastRows = rows; draw(rows); } }, function (err) {
        MFM.fill(root, [h('div', { class: 'note err', text: tr('err_read', err && err.message ? err.message : tr('err_unknown')) })]);
      });
    }

    function cardLink(card) {
      return h('a', { class: 'link', text: card.name, title: tr('open_card'), onclick: function () {
        Promise.resolve(t.showCard(card.id)).then(function () { return t.closeModal(); }, function () { /* ignore */ });
      } });
    }

    // Optional status field: bring every card that has a fee schedule up to date, one card at a time
    // (two small requests per card, well inside Trello's rate limit).
    function syncAll(rows) {
      var list = rows.filter(function (x) { return x.fee; }), i = 0, changed = 0, failed = 0;
      syncBusy = true;
      var step = function () {
        if (i >= list.length) {
          syncBusy = false; syncMsg = tr('fs_done', list.length, changed, failed); draw(lastRows);
          return null;
        }
        syncMsg = tr('fs_progress', i, list.length); draw(lastRows);
        return MFM.syncStatus(t, list[i].card.id, list[i].fee, cfg).then(function (r) {
          if (r.skip === 'auth') { syncBusy = false; syncMsg = tr('fs_need_auth'); draw(lastRows); return null; }
          if (r.changed) changed++;
          if (r.err) failed++;
          i++;
          return new Promise(function (ok) { setTimeout(ok, 150); }).then(step);
        });
      };
      return step();
    }
    function syncBar(rows) {
      if (!cfg || !cfg.sync || !MFM.rest(t).ok || !rows.length) return null;
      return h('div', { class: 'foot' }, [
        h('button', { type: 'button', text: tr('fs_sync_all'), disabled: syncBusy, onclick: function () { syncAll(rows); } }),
        syncMsg ? h('span', { class: 'muted small', text: syncMsg }) : null
      ]);
    }

    function csvPanel(rows) {
      var area = h('textarea', { readonly: true, class: 'csv' });
      area.value = MFM.toCsv(rows);
      var copyBtn = h('button', { class: 'primary', text: copied ? tr('copied') : tr('copy'), onclick: function () {
        area.focus(); area.select();
        var done = function () { copied = true; copyBtn.textContent = tr('copied'); };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(area.value).then(done, function () { if (document.execCommand('copy')) done(); });
          else if (document.execCommand('copy')) done();
        } catch (e) { /* the text stays selected so it can be copied by hand */ }
      } });
      return h('div', { class: 'csvbox' }, [
        h('div', { class: 'muted', text: tr('export_hint') }),
        area,
        h('div', { class: 'foot' }, [h('span', { class: 'grow' }), h('button', { text: tr('close'), onclick: function () { showCsv = false; copied = false; draw(lastRows); } }), copyBtn])
      ]);
    }

    function draw(rows) {
      var today = MFM.today();
      var withFee = rows.filter(function (x) { return x.fee && x.fee.st.length; });
      var tot = { toInvoice: 0, awaiting: 0, overdue: 0, outstanding: 0, paid: 0 };
      var todo = [];

      withFee.forEach(function (x) {
        x.sum = MFM.summarize(x.fee, today);
        tot.toInvoice += x.sum.toInvoice; tot.awaiting += x.sum.awaiting;
        tot.overdue += x.sum.overdue; tot.outstanding += x.sum.outstanding; tot.paid += x.sum.paid;
        x.fee.st.forEach(function (s) {
          if (s.s !== 1 && s.s !== 2) return;
          if (MFM.owing(s) <= 0) return;
          var note = MFM.stageNote(s, today);
          // sort: overdue (most days first) > to invoice (longest wait first) > not yet due (soonest first)
          var rank = note.kind === 'late' ? 3e6 + note.days : (s.s === 1 ? 2e6 + note.days : 1e6 + note.days);
          todo.push({ x: x, s: s, note: note, rank: rank });
        });
      });
      todo.sort(function (a, b) { return b.rank - a.rank; });

      var tile = function (cls, k, v, sub) {
        return h('div', { class: 'tile' + cls }, [h('div', { class: 'k', text: k }), h('div', { class: 'v', text: MFM.fmtMoney(v) }), h('div', { class: 'sub', text: sub })]);
      };
      var tiles = h('div', { class: 'tiles five' }, [
        tile(tot.overdue > 0 ? ' late' : '', tr('t_over'), tot.overdue, tr('t_over_sub')),
        tile(tot.awaiting - tot.overdue > 0 ? ' hot' : '', tr('t_inv'), tot.awaiting - tot.overdue, tr('t_inv_sub')),
        tile(tot.toInvoice > 0 ? ' hot' : '', tr('t_done'), tot.toInvoice, tr('t_done_sub')),
        tile('', tr('t_bal'), tot.outstanding, tr('t_bal_sub')),
        tile('', tr('t_recv'), tot.paid, tr('t_recv_sub', withFee.length))
      ]);

      var todoTable;
      if (!todo.length) {
        todoTable = h('div', { class: 'empty', text: tr('none_todo') });
      } else {
        todoTable = h('table', {}, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: tr('c_matter') }), h('th', { text: tr('c_list') }), h('th', { text: tr('c_stage') }),
            h('th', { class: 'num', text: tr('c_amount') }), h('th', { text: tr('c_status') }), h('th', { text: tr('c_inv') }), h('th', { text: tr('c_timing') })
          ])]),
          h('tbody', {}, todo.map(function (it) {
            var late = it.note.kind === 'late', owing = MFM.owing(it.s);
            return h('tr', {}, [
              h('td', {}, [cardLink(it.x.card)]),
              h('td', { class: 'muted', text: it.x.list }),
              h('td', { text: it.s.n || tr('unnamed') }),
              h('td', { class: 'num' }, [MFM.fmtMoney(owing), owing !== it.s.a ? h('div', { class: 'hint', text: tr('of_amount', MFM.fmtMoney(it.s.a, true)) }) : null]),
              h('td', {}, [h('span', { class: 'pill ' + (late ? 'late' : 's' + it.s.s), text: late ? tr('t_over') : MFM.statusLabel(it.s.s) })]),
              h('td', { class: 'muted', text: it.s.inv || '—' }),
              h('td', { class: 'hint ' + (late ? 'late' : it.s.s === 1 ? 'warn' : ''), text: it.note.text })
            ]);
          }))
        ]);
      }

      withFee.sort(function (a, b) { return (b.sum.receivable - a.sum.receivable) || (b.sum.outstanding - a.sum.outstanding); });
      var allTable = !withFee.length
        ? h('div', { class: 'empty', text: tr('none_all') })
        : h('table', {}, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: tr('c_matter') }), h('th', { class: 'num', text: tr('c_total') }), h('th', { class: 'num', text: tr('c_received') }),
            h('th', { class: 'num', text: tr('c_now') }), h('th', { class: 'num', text: tr('c_notdue') }), h('th', { text: tr('c_prog') })
          ])]),
          h('tbody', {}, withFee.map(function (x) {
            var r = x.sum, base = r.sum > 0 ? r.sum : 1;
            var w = function (v) { return 'width:' + (v / base * 100).toFixed(1) + '%'; };
            return h('tr', {}, [
              h('td', {}, [cardLink(x.card), r.mismatch ? h('div', { class: 'hint warn', text: tr('mismatch_short') }) : null]),
              h('td', { class: 'num', text: MFM.fmtMoney(r.total) }),
              h('td', { class: 'num', text: MFM.fmtMoney(r.paid) }),
              h('td', { class: 'num', text: MFM.fmtMoney(r.receivable), style: r.overdue > 0 ? 'color:var(--red);font-weight:600' : (r.receivable > 0 ? 'color:var(--orange);font-weight:600' : '') }),
              h('td', { class: 'num muted', text: MFM.fmtMoney(r.notDue) }),
              h('td', {}, [
                h('span', { class: 'minibar' }, [
                  h('i', { style: w(r.paid) + ';background:var(--green)' }),
                  h('i', { style: w(r.overdue) + ';background:var(--red-bar)' }),
                  h('i', { style: w(r.awaiting - r.overdue) + ';background:var(--orange-bar)' }),
                  h('i', { style: w(r.toInvoice) + ';background:var(--yellow-bar)' })
                ]),
                h('span', { class: 'muted', text: ' ' + r.nPaid + '/' + r.n })
              ])
            ]);
          }))
        ]);

      MFM.fill(root, [
        MFM.demo ? h('div', { class: 'demo-banner', text: tr('demo_short') }) : null,
        tiles,
        h('h2', {}, [tr('h_todo'), h('small', { text: tr('h_todo_sub', todo.length) })]),
        todoTable,
        h('div', { class: 'h2row' }, [
          h('h2', {}, [tr('h_all'), h('small', { text: tr('h_all_sub') })]),
          withFee.length && !showCsv ? h('button', { text: tr('export'), onclick: function () { showCsv = true; draw(lastRows); } }) : null
        ]),
        showCsv ? csvPanel(withFee) : null,
        allTable,
        syncBar(withFee),
        h('div', { class: 'note info', text: tr('footnote', MFM.fmtDate(today)) })
      ]);
    }

    return t.render(load);
  };
})();
