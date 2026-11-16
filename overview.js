/* Matter Fee Manager — board-level receivables overview (modal opened from the board button) */
(function () {
  'use strict';
  var MFM = window.MFM, h = MFM.h;

  MFM.mountOverview = function (t, root) {
    function load() {
      return Promise.all([t.cards('id', 'name', 'idList'), t.lists('id', 'name')]).then(function (r) {
        var cards = r[0] || [], lists = {};
        (r[1] || []).forEach(function (l) { lists[l.id] = l.name; });
        return Promise.all(cards.map(function (c) {
          return t.get(c.id, 'shared', MFM.KEY).then(function (fee) {
            return { card: c, list: lists[c.idList] || '', fee: fee ? MFM.normalize(fee) : null };
          }, function () {
            return { card: c, list: lists[c.idList] || '', fee: null };
          });
        }));
      }).then(draw, function (err) {
        MFM.fill(root, [h('div', { class: 'note err', text: 'Could not read board data: ' + (err && err.message ? err.message : 'unknown error') })]);
      });
    }

    function cardLink(card) {
      return h('a', { class: 'link', text: card.name, title: 'Open card', onclick: function () {
        Promise.resolve(t.showCard(card.id)).then(function () { return t.closeModal(); }, function () { /* ignore */ });
      } });
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
          var note = MFM.stageNote(s, today);
          // sort: overdue (most days first) > to invoice (longest wait first) > not yet due (soonest first)
          var rank = note.kind === 'late' ? 3e6 + note.days : (s.s === 1 ? 2e6 + note.days : 1e6 + note.days);
          todo.push({ x: x, s: s, note: note, rank: rank });
        });
      });
      todo.sort(function (a, b) { return b.rank - a.rank; });

      var tiles = h('div', { class: 'tiles five' }, [
        h('div', { class: 'tile' + (tot.overdue > 0 ? ' late' : '') }, [
          h('div', { class: 'k', text: 'Overdue' }), h('div', { class: 'v', text: MFM.fmtMoney(tot.overdue) }),
          h('div', { class: 'sub', text: 'Past the due date' })]),
        h('div', { class: 'tile' + (tot.awaiting - tot.overdue > 0 ? ' hot' : '') }, [
          h('div', { class: 'k', text: 'Invoiced, unpaid' }), h('div', { class: 'v', text: MFM.fmtMoney(tot.awaiting - tot.overdue) }),
          h('div', { class: 'sub', text: 'Not yet due' })]),
        h('div', { class: 'tile' + (tot.toInvoice > 0 ? ' hot' : '') }, [
          h('div', { class: 'k', text: 'Done, to invoice' }), h('div', { class: 'v', text: MFM.fmtMoney(tot.toInvoice) }),
          h('div', { class: 'sub', text: 'Time to bill' })]),
        h('div', { class: 'tile' }, [
          h('div', { class: 'k', text: 'Contract balance' }), h('div', { class: 'v', text: MFM.fmtMoney(tot.outstanding) }),
          h('div', { class: 'sub', text: 'Incl. stages not started' })]),
        h('div', { class: 'tile' }, [
          h('div', { class: 'k', text: 'Total received' }), h('div', { class: 'v', text: MFM.fmtMoney(tot.paid) }),
          h('div', { class: 'sub', text: withFee.length + ' matter(s) with a schedule' })])
      ]);

      var todoTable;
      if (!todo.length) {
        todoTable = h('div', { class: 'empty', text: 'Nothing to invoice or chase right now.' });
      } else {
        todoTable = h('table', {}, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: 'Matter (card)' }), h('th', { text: 'List' }), h('th', { text: 'Stage' }),
            h('th', { class: 'num', text: 'Amount' }), h('th', { text: 'Status' }), h('th', { text: 'Invoice no.' }), h('th', { text: 'Timing' })
          ])]),
          h('tbody', {}, todo.map(function (it) {
            var late = it.note.kind === 'late';
            return h('tr', {}, [
              h('td', {}, [cardLink(it.x.card)]),
              h('td', { class: 'muted', text: it.x.list }),
              h('td', { text: it.s.n || '(unnamed stage)' }),
              h('td', { class: 'num', text: MFM.fmtMoney(it.s.a) }),
              h('td', {}, [h('span', { class: 'pill ' + (late ? 'late' : 's' + it.s.s), text: late ? 'Overdue' : MFM.STATUS[it.s.s].label })]),
              h('td', { class: 'muted', text: it.s.inv || '—' }),
              h('td', { class: 'hint ' + (late ? 'late' : it.s.s === 1 ? 'warn' : ''), text: it.note.text })
            ]);
          }))
        ]);
      }

      withFee.sort(function (a, b) { return (b.sum.receivable - a.sum.receivable) || (b.sum.outstanding - a.sum.outstanding); });
      var allTable = !withFee.length
        ? h('div', { class: 'empty', text: 'No card on this board has a fee schedule yet. Open a card → click the "Fee schedule" button to create one.' })
        : h('table', {}, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: 'Matter (card)' }), h('th', { class: 'num', text: 'Contract total' }), h('th', { class: 'num', text: 'Received' }),
            h('th', { class: 'num', text: 'Receivable now' }), h('th', { class: 'num', text: 'Not yet due' }), h('th', { text: 'Progress' })
          ])]),
          h('tbody', {}, withFee.map(function (x) {
            var r = x.sum, base = r.sum > 0 ? r.sum : 1;
            var w = function (v) { return 'width:' + (v / base * 100).toFixed(1) + '%'; };
            return h('tr', {}, [
              h('td', {}, [cardLink(x.card), r.mismatch ? h('div', { class: 'hint warn', text: 'Stages ≠ contract total' }) : null]),
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
        MFM.demo ? h('div', { class: 'demo-banner', text: 'Demo mode: fictional data.' }) : null,
        tiles,
        h('h2', {}, ['Needs follow-up', h('small', { text: todo.length + ' stage(s) · overdue → to invoice → not yet due' })]),
        todoTable,
        h('h2', {}, ['All matters', h('small', { text: 'sorted by amount receivable now' })]),
        allTable,
        h('div', { class: 'note info', text: 'Figures come from each card\'s fee schedule (as at ' + MFM.fmtDate(today) + ', archived cards excluded). Amounts are entered by hand and are not accounting or trust records.' })
      ]);
    }

    return t.render(load);
  };
})();
