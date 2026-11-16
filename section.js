/* Matter Fee Manager — the staged fee schedule on the card back
 * Save strategy: Trello reloads the card-back-section iframe after t.set, so text and
 * amount edits stay local (shown as "unsaved") and are written in one go when:
 *   1) a status changes  2) Save is clicked  3) the user clicks outside the schedule (window blur)
 */
(function () {
  'use strict';
  var MFM = window.MFM, h = MFM.h;

  MFM.mountSection = function (t, root) {
    var state = { v: 1, st: [] };
    var cfg = MFM.cfg(null);
    var dirty = false, saving = false, canWrite = true, errMsg = '', armedDelete = null;
    var summaryEl, barEl, saveEl, errEl;

    try {
      var ctx = t.getContext() || {};
      if (ctx.permissions && ctx.permissions.card && ctx.permissions.card !== 'write') canWrite = false;
    } catch (e) { /* if permissions are unavailable assume writable; a failed write shows an error */ }

    function resize() { try { t.sizeTo('#' + root.id); } catch (e) { /* demo mode */ } }

    function load() {
      return Promise.all([
        t.get('card', 'shared', MFM.KEY),
        t.get('board', 'shared', MFM.CFG_KEY)
      ]).then(function (r) {
        cfg = MFM.cfg(r[1]);
        if (!dirty && !saving) state = MFM.normalize(r[0]);
        draw();
      });
    }

    function markDirty() {
      dirty = true;
      drawSummary();
      drawSave();
    }

    function hasBadAmount() { return !!root.querySelector('input.bad'); }

    function save() {
      if (!canWrite || saving) return Promise.resolve(false);
      if (hasBadAmount()) { errMsg = 'An amount is not valid (digits only, up to two decimals). Fix it, then save.'; drawErr(); return Promise.resolve(false); }
      var payload = MFM.compact(state);
      if (MFM.sizeOf(payload) > MFM.SIZE_LIMIT) {
        errMsg = 'This exceeds Trello\'s per-card storage limit (about 4,000 characters). Shorten stage names or use fewer stages.';
        drawErr();
        return Promise.resolve(false);
      }
      saving = true; errMsg = ''; drawSave(); drawErr();
      return t.set('card', 'shared', MFM.KEY, payload).then(function () {
        saving = false; dirty = false; drawSave();
        return true;
      }, function (err) {
        saving = false;
        errMsg = 'Save failed: ' + (err && err.message ? err.message : 'unknown error') + '. Your edits are still on the page; try again.';
        drawSave(); drawErr();
        return false;
      });
    }

    function revert() { dirty = false; errMsg = ''; load(); }

    /* ---------- summary ---------- */
    function drawSummary() {
      var r = MFM.summarize(state);
      var kids = [];
      kids.push(h('div', { class: 'tile' }, [
        h('div', { class: 'k', text: 'Contract total' }),
        h('div', { class: 'v', text: MFM.fmtMoney(r.total) }),
        h('div', { class: 'sub', text: r.n + (r.n === 1 ? ' stage' : ' stages') })
      ]));
      kids.push(h('div', { class: 'tile' + (r.sum > 0 && r.paid === r.sum ? ' done' : '') }, [
        h('div', { class: 'k', text: 'Received' }),
        h('div', { class: 'v', text: MFM.fmtMoney(r.paid) }),
        h('div', { class: 'sub', text: r.nPaid + ' / ' + r.n + ' stages' })
      ]));
      var sub = [];
      if (r.toInvoice > 0) sub.push('To invoice ' + MFM.fmtMoney(r.toInvoice, true));
      if (r.awaiting > 0) sub.push('Unpaid ' + MFM.fmtMoney(r.awaiting, true));
      if (r.overdue > 0) sub.push(r.overdueDays + 'd overdue');
      kids.push(h('div', { class: 'tile' + (r.overdue > 0 ? ' late' : (r.receivable > 0 ? ' hot' : '')) }, [
        h('div', { class: 'k', text: 'Receivable now' }),
        h('div', { class: 'v', text: MFM.fmtMoney(r.receivable) }),
        h('div', { class: 'sub', text: sub.join(' · ') || 'Nothing due right now' })
      ]));
      kids.push(h('div', { class: 'tile' }, [
        h('div', { class: 'k', text: 'Not yet due' }),
        h('div', { class: 'v', text: MFM.fmtMoney(r.notDue) }),
        h('div', { class: 'sub', text: 'Work not done yet' })
      ]));
      MFM.fill(summaryEl, kids);

      var base = r.sum > 0 ? r.sum : 1;
      var pct = function (v) { return 'width:' + (v / base * 100).toFixed(2) + '%'; };
      MFM.fill(barEl, [
        h('div', { class: 'bar' }, [
          h('i', { class: 'p', style: pct(r.paid) }),
          h('i', { class: 'l', style: pct(r.overdue) }),
          h('i', { class: 'w', style: pct(r.awaiting - r.overdue) }),
          h('i', { class: 't', style: pct(r.toInvoice) })
        ]),
        h('div', { class: 'legend' }, [
          h('span', { class: 'p', text: 'Received' }),
          h('span', { class: 'l', text: 'Overdue' }),
          h('span', { class: 'w', text: 'Invoiced, unpaid' }),
          h('span', { class: 't', text: 'Done, to invoice' }),
          h('span', { text: 'Not yet due' })
        ]),
        r.mismatch ? h('div', {
          class: 'note warn',
          text: 'Stages add up to ' + MFM.fmtMoney(r.sum) + ' ≠ contract total ' + MFM.fmtMoney(r.contract) +
            ' (difference ' + MFM.fmtMoney(Math.abs(r.contract - r.sum)) + '). Check the stage amounts or the contract total.'
        }) : null
      ]);
      resize();
    }

    function drawSave() {
      if (!saveEl) return;
      if (!canWrite) { MFM.fill(saveEl, [h('span', { class: 'state', text: 'Read-only (you cannot edit this card)' })]); return; }
      if (saving) { MFM.fill(saveEl, [h('span', { class: 'state', text: 'Saving…' })]); return; }
      if (dirty) {
        MFM.fill(saveEl, [
          h('span', { class: 'state dirty', text: 'Unsaved changes' }),
          h('button', { text: 'Discard', onclick: revert }),
          h('button', { class: 'primary', text: 'Save', onclick: function () { save(); } })
        ]);
      } else {
        MFM.fill(saveEl, [h('span', { class: 'state', text: 'Saved' })]);
      }
    }

    function drawErr() {
      if (!errEl) return;
      MFM.fill(errEl, [errMsg ? h('div', { class: 'note err', text: errMsg }) : null]);
      resize();
    }

    /* ---------- stage rows ---------- */
    function stageRow(s, idx) {
      var note = MFM.stageNote(s);
      var dis = !canWrite;

      var name = h('input', {
        type: 'text', class: 'name', value: s.n, placeholder: 'Stage name (e.g. Application lodged)', maxlength: '60', disabled: dis,
        oninput: function () { s.n = name.value; markDirty(); }
      });
      var amt = h('input', {
        type: 'text', class: 'amt', inputmode: 'decimal', value: MFM.moneyInput(s.a), disabled: dis,
        oninput: function () {
          var c = MFM.parseMoney(amt.value);
          if (c === null) { amt.classList.add('bad'); dirty = true; drawSave(); return; }
          amt.classList.remove('bad');
          s.a = c; markDirty();
        },
        onblur: function () { if (!amt.classList.contains('bad')) amt.value = MFM.moneyInput(s.a); }
      });
      var sel = h('select', {
        class: 's' + s.s + (note.kind === 'late' ? ' late' : ''), disabled: dis,
        onchange: function () {
          MFM.setStatus(s, +sel.value, cfg);
          dirty = true;
          draw();
          save(); // a status change saves immediately
        }
      }, MFM.STATUS.map(function (st) {
        var o = h('option', { value: String(st.id), text: st.label });
        if (st.id === s.s) o.selected = true;
        return o;
      }));
      var inv = h('input', {
        type: 'text', value: s.inv || '', placeholder: 'Invoice no.', maxlength: '24', disabled: dis,
        oninput: function () { if (inv.value.trim()) s.inv = inv.value.trim(); else delete s.inv; markDirty(); }
      });

      // date field: paid stages show the date paid, others the payment due date (auto-filled from the terms on invoicing)
      var dateKey = s.s === 3 ? 'pd' : 'd';
      var date = h('input', {
        type: 'date', value: s[dateKey] || '', disabled: dis || s.s < 2,
        title: s.s === 3 ? 'Date paid' : 'Payment due date (applies once invoiced)',
        onchange: function () { if (date.value) s[dateKey] = date.value; else delete s[dateKey]; markDirty(); drawRows(); }
      });

      var del;
      if (armedDelete === s.i) {
        del = h('button', { class: 'danger', text: 'Confirm delete', disabled: dis, onclick: function () {
          state.st.splice(idx, 1); armedDelete = null; dirty = true; draw();
        } });
      } else {
        del = h('button', { class: 'icon', text: '✕', title: 'Delete this stage', disabled: dis, onclick: function () { armedDelete = s.i; drawRows(); } });
      }
      var move = function (d) {
        return function () {
          var j = idx + d;
          if (j < 0 || j >= state.st.length) return;
          var tmp = state.st[idx]; state.st[idx] = state.st[j]; state.st[j] = tmp;
          dirty = true; draw();
        };
      };

      var dates = [];
      if (s.dd) dates.push('Done ' + MFM.fmtDate(s.dd));
      if (s.bd) dates.push('Invoiced ' + MFM.fmtDate(s.bd));

      return h('div', { class: 'stage' + (s.s === 3 ? ' paid' : '') }, [
        h('div', { class: 'l1' }, [
          h('span', { class: 'idx', text: String(idx + 1) }),
          name, amt, sel
        ]),
        h('div', { class: 'l2' }, [
          h('span', { class: 'idx' }),
          inv,
          h('label', { class: 'dl' }, [h('span', { text: s.s === 3 ? 'Paid' : 'Due' }), date]),
          h('span', { class: 'hint ' + (note.kind === 'warn' ? 'warn' : note.kind === 'late' ? 'late' : note.kind === 'ok' ? 'ok' : ''),
            text: note.text, title: dates.join(' · ') }),
          h('span', { class: 'acts' }, [
            h('button', { class: 'icon', text: '↑', title: 'Move up', disabled: dis || idx === 0, onclick: move(-1) }),
            h('button', { class: 'icon', text: '↓', title: 'Move down', disabled: dis || idx === state.st.length - 1, onclick: move(1) }),
            del
          ])
        ])
      ]);
    }

    var rowsEl;
    function drawRows() {
      if (!state.st.length) {
        var kids = [h('div', { text: 'No fee stages yet.' })];
        if (canWrite) {
          var btns = cfg.tpls.map(function (tpl) {
            return h('button', { text: 'Use template: ' + tpl.n, onclick: function () {
              state.st = MFM.fromTemplate(tpl).st; dirty = true; draw();
            } });
          });
          kids.push(h('div', { class: 'foot', style: 'justify-content:center' }, btns));
        }
        MFM.fill(rowsEl, [h('div', { class: 'empty' }, kids)]);
      } else {
        MFM.fill(rowsEl, [
          h('div', { class: 'stage head' }, [h('div', { class: 'l1' }, [
            h('span', { class: 'idx', text: '#' }), h('span', { text: 'Stage' }),
            h('span', { class: 'num', text: 'Inc. GST ($)' }), h('span', { text: 'Status' })
          ])])
        ].concat(state.st.map(stageRow)));
      }
      resize();
    }

    function draw() {
      summaryEl = h('div', { class: 'tiles' });
      barEl = h('div');
      rowsEl = h('div', { class: 'stages' });
      saveEl = h('div', { class: 'savebar' });
      errEl = h('div');

      var contract = h('input', {
        type: 'text', class: 'amt', inputmode: 'decimal', placeholder: 'optional', disabled: !canWrite,
        value: state.c ? MFM.moneyInput(state.c) : '',
        oninput: function () {
          var c = MFM.parseMoney(contract.value);
          if (c === null) { contract.classList.add('bad'); dirty = true; drawSave(); return; }
          contract.classList.remove('bad');
          if (c > 0) state.c = c; else delete state.c;
          markDirty();
        }
      });

      MFM.fill(root, [
        MFM.demo ? h('div', { class: 'demo-banner', text: 'Demo mode: not connected to Trello. The data is fictional and resets on refresh.' }) : null,
        summaryEl, barEl, rowsEl, errEl,
        h('div', { class: 'foot' }, [
          h('button', { text: '+ Add stage', disabled: !canWrite, onclick: function () {
            state.st.push(MFM.newStage('', 0)); dirty = true; draw();
            var names = root.querySelectorAll('input.name');
            if (names.length) names[names.length - 1].focus();
          } }),
          h('label', {}, [h('span', { text: 'Contract total (for cross-check)' }), contract]),
          h('span', { class: 'grow' }),
          saveEl
        ])
      ]);
      drawSummary(); drawRows(); drawSave(); drawErr();
    }

    // auto-save when the user clicks outside the schedule, so closing the card without pressing Save does not lose edits
    window.addEventListener('blur', function () { if (dirty && !saving) save(); });

    return t.render(load);
  };
})();
