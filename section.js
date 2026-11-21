/* Matter Fee Manager — the staged fee schedule on the card back
 * Save strategy: Trello reloads the card-back-section iframe after t.set, so text and amount edits
 * stay local (shown as "unsaved") and are written in one go when:
 *   1) a status changes  2) Save is clicked  3) the user clicks outside the schedule (window blur)
 * Before writing, the stored revision counter is compared with the one loaded; if somebody else
 * saved in between, nothing is overwritten until the user chooses which version to keep.
 */
(function () {
  'use strict';
  var MFM = window.MFM, h = MFM.h, tr = MFM.tr;

  MFM.mountSection = function (t, root) {
    var state = { v: 1, rv: 0, st: [] };
    var cfg = MFM.cfg(null);
    var loadedRv = 0;
    var dirty = false, saving = false, canWrite = true, conflict = false, errMsg = '', armedDelete = null;
    var summaryEl, barEl, saveEl, errEl, rowsEl, syncEl;
    var syncNote = null, syncing = false, syncAgain = false;

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
        if (!MFM.canSee(t)) { MFM.fill(root, [h('div', { class: 'note info', text: tr('no_access') })]); resize(); return; }
        if (!dirty && !saving) { state = MFM.normalize(r[0]); loadedRv = state.rv || 0; conflict = false; }
        draw();
        reconcile();
      });
    }

    function markDirty() { dirty = true; drawSummary(); drawSave(); }
    function hasBadInput() { return !!root.querySelector('input.bad'); }

    function save(force) {
      if (!canWrite || saving) return Promise.resolve(false);
      if (hasBadInput()) { errMsg = tr('err_amount'); drawErr(); return Promise.resolve(false); }
      saving = true; errMsg = ''; drawSave(); drawErr();
      var fail = function (err) {
        saving = false;
        errMsg = tr('err_save', err && err.message ? err.message : tr('err_unknown'));
        drawSave(); drawErr();
        return false;
      };
      return t.get('card', 'shared', MFM.KEY).then(function (cur) {
        var curRv = cur && typeof cur.rv === 'number' ? cur.rv : 0;
        if (!force && curRv !== loadedRv) {      // somebody else saved since we loaded
          saving = false; conflict = true; drawSave(); drawErr();
          return false;
        }
        var payload = MFM.compact(state);
        payload.rv = curRv + 1;
        if (MFM.sizeOf(payload) > MFM.SIZE_LIMIT) {
          saving = false; errMsg = tr('err_size'); drawSave(); drawErr();
          return false;
        }
        return t.set('card', 'shared', MFM.KEY, payload).then(function () {
          saving = false; dirty = false; conflict = false; loadedRv = payload.rv; state.rv = payload.rv;
          drawSave(); drawErr();
          reconcile();
          return true;
        }, fail);
      }, fail);
    }

    /* ---------- optional status field (see shared.js) ----------
     * Runs after every load and save: reads the card's status field and rewrites it only when it no
     * longer matches the saved schedule. Unsaved edits are never copied.
     */
    function reconcile() {
      if (MFM.demo || !canWrite || !cfg.sync || dirty) return;
      if (syncing) { syncAgain = true; return; }
      syncing = true;
      MFM.syncStatus(t, (t.getContext() || {}).card, MFM.compact(state), cfg).then(function (r) {
        syncing = false;
        var next = r.skip === 'auth' ? 'auth' : (r.err ? (r.status === 404 || r.status === 400 ? tr('fs_gone') : r.err) : null);
        if (next !== syncNote) { syncNote = next; drawSync(); }
        if (syncAgain) { syncAgain = false; reconcile(); }
      });
    }
    function drawSync() {
      if (!syncEl) return;
      var kids = [];
      if (syncNote === 'auth') {
        kids.push(h('div', { class: 'note info' }, [
          h('span', { text: tr('fs_need_auth') + ' ' }),
          // authorize() is called straight from the click so the browser allows Trello's consent window
          h('button', { type: 'button', text: tr('fs_authorize'), onclick: function () {
            MFM.rest(t).authorize().then(function (tok) { if (tok) reconcile(); }).catch(function () { /* consent window closed */ });
          } })
        ]));
      } else if (syncNote) {
        kids.push(h('div', { class: 'note warn', text: tr('fs_err', syncNote) }));
      }
      MFM.fill(syncEl, kids);
      resize();
    }

    function revert() { dirty = false; conflict = false; errMsg = ''; return load(); }

    /* ---------- summary ---------- */
    function drawSummary() {
      var r = MFM.summarize(state);
      var sub = [];
      if (r.toInvoice > 0) sub.push(tr('sub_toinv', MFM.fmtMoney(r.toInvoice, true)));
      if (r.awaiting > 0) sub.push(tr('sub_unpaid', MFM.fmtMoney(r.awaiting, true)));
      if (r.overdue > 0) sub.push(tr('sub_over', r.overdueDays));
      MFM.fill(summaryEl, [
        h('div', { class: 'tile' }, [
          h('div', { class: 'k', text: tr('k_total') }),
          h('div', { class: 'v', text: MFM.fmtMoney(r.total) }),
          h('div', { class: 'sub', text: tr('n_stages', r.n) })
        ]),
        h('div', { class: 'tile' + (r.sum > 0 && r.paid === r.sum ? ' done' : '') }, [
          h('div', { class: 'k', text: tr('k_recv') }),
          h('div', { class: 'v', text: MFM.fmtMoney(r.paid) }),
          h('div', { class: 'sub', text: tr('n_of_stages', r.nPaid, r.n) })
        ]),
        h('div', { class: 'tile' + (r.overdue > 0 ? ' late' : (r.receivable > 0 ? ' hot' : '')) }, [
          h('div', { class: 'k', text: tr('k_now') }),
          h('div', { class: 'v', text: MFM.fmtMoney(r.receivable) }),
          h('div', { class: 'sub', text: sub.join(' · ') || tr('sub_none') })
        ]),
        h('div', { class: 'tile' }, [
          h('div', { class: 'k', text: tr('k_notdue') }),
          h('div', { class: 'v', text: MFM.fmtMoney(r.notDue) }),
          h('div', { class: 'sub', text: tr('sub_notdone') })
        ])
      ]);

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
          h('span', { class: 'p', text: tr('lg_recv') }),
          h('span', { class: 'l', text: tr('lg_over') }),
          h('span', { class: 'w', text: tr('lg_inv') }),
          h('span', { class: 't', text: tr('lg_done') }),
          h('span', { text: tr('lg_notdue') })
        ]),
        r.mismatch ? h('div', {
          class: 'note warn',
          text: tr('mismatch', MFM.fmtMoney(r.sum), MFM.fmtMoney(r.contract), MFM.fmtMoney(Math.abs(r.contract - r.sum)))
        }) : null
      ]);
      resize();
    }

    function drawSave() {
      if (!saveEl) return;
      if (!canWrite) { MFM.fill(saveEl, [h('span', { class: 'state', text: tr('ro') })]); return; }
      if (saving) { MFM.fill(saveEl, [h('span', { class: 'state', text: tr('saving') })]); return; }
      if (dirty) {
        MFM.fill(saveEl, [
          h('span', { class: 'state dirty', text: tr('unsaved') }),
          h('button', { text: tr('discard'), onclick: revert }),
          h('button', { class: 'primary', text: tr('save'), onclick: function () { save(); } })
        ]);
      } else {
        MFM.fill(saveEl, [h('span', { class: 'state', text: tr('saved') })]);
      }
    }

    function drawErr() {
      if (!errEl) return;
      MFM.fill(errEl, [
        conflict ? h('div', { class: 'note err' }, [
          h('div', { text: tr('err_conflict') }),
          h('div', { class: 'foot' }, [
            h('button', { text: tr('btn_reload'), onclick: revert }),
            h('button', { text: tr('btn_overwrite'), onclick: function () { save(true); } })
          ])
        ]) : null,
        errMsg ? h('div', { class: 'note err', text: errMsg }) : null
      ]);
      resize();
    }

    /* ---------- stage rows ---------- */
    function stageRow(s, idx) {
      var note = MFM.stageNote(s);
      var dis = !canWrite;

      var name = h('input', {
        type: 'text', class: 'name', value: s.n, placeholder: tr('ph_stage'), maxlength: '60', disabled: dis,
        oninput: function () { s.n = name.value; markDirty(); }
      });
      var amt = h('input', {
        type: 'text', class: 'amt', inputmode: 'decimal', value: MFM.moneyInput(s.a), disabled: dis,
        oninput: function () {
          var c = MFM.parseMoney(amt.value);
          if (c === null) { amt.classList.add('bad'); dirty = true; drawSave(); return; }
          amt.classList.remove('bad');
          s.a = c;
          if (s.r && s.r > s.a) s.r = s.a;
          markDirty();
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
      }, [0, 1, 2, 3].map(function (id) {
        var o = h('option', { value: String(id), text: MFM.statusLabel(id) });
        if (id === s.s) o.selected = true;
        return o;
      }));
      var inv = h('input', {
        type: 'text', class: 'inv', value: s.inv || '', placeholder: tr('ph_inv'), maxlength: '24', disabled: dis,
        oninput: function () { if (inv.value.trim()) s.inv = inv.value.trim(); else delete s.inv; markDirty(); }
      });

      // date field: paid stages show the date paid, others the payment due date
      var dateKey = s.s === 3 ? 'pd' : 'd';
      var date = h('input', {
        type: 'date', value: s[dateKey] || '', disabled: dis || s.s < 2,
        title: s.s === 3 ? tr('ti_paid') : tr('ti_due'),
        onchange: function () { if (date.value) s[dateKey] = date.value; else delete s[dateKey]; markDirty(); drawRows(); }
      });

      // part payment: only meaningful while the stage is invoiced and unpaid
      var recv = null;
      if (s.s === 2) {
        var rin = h('input', {
          type: 'text', class: 'amt', inputmode: 'decimal', placeholder: '0.00', disabled: dis,
          value: s.r ? MFM.moneyInput(s.r) : '', title: tr('ti_recv'),
          oninput: function () {
            var c = MFM.parseMoney(rin.value);
            if (c === null || c > s.a) {
              rin.classList.add('bad'); dirty = true; drawSave();
              if (c !== null) { errMsg = tr('err_recv'); drawErr(); }
              return;
            }
            rin.classList.remove('bad');
            if (errMsg) { errMsg = ''; drawErr(); }
            if (c > 0) s.r = c; else delete s.r;
            markDirty();
          }
        });
        recv = h('label', { class: 'dl rv' }, [h('span', { text: tr('l_recv') }), rin]);
      }

      var del;
      if (armedDelete === s.i) {
        del = h('button', { class: 'danger', text: tr('confirm_del'), disabled: dis, onclick: function () {
          state.st.splice(idx, 1); armedDelete = null; dirty = true; draw();
        } });
      } else {
        del = h('button', { class: 'icon', text: '✕', title: tr('ti_del'), disabled: dis, onclick: function () { armedDelete = s.i; drawRows(); } });
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
      if (s.dd) dates.push(tr('d_done', MFM.fmtDate(s.dd)));
      if (s.bd) dates.push(tr('d_inv', MFM.fmtDate(s.bd)));
      var hint = (s.s === 2 && s.r ? tr('note_part', MFM.fmtMoney(s.r, true)) + ' · ' : '') + note.text;

      return h('div', { class: 'stage' + (s.s === 3 ? ' paid' : '') }, [
        h('div', { class: 'l1' }, [h('span', { class: 'idx', text: String(idx + 1) }), name, amt, sel]),
        h('div', { class: 'l2' }, [
          h('span', { class: 'idx' }),
          inv,
          h('label', { class: 'dl' }, [h('span', { text: s.s === 3 ? tr('l_paid') : tr('l_due') }), date]),
          recv,
          h('span', { class: 'hint ' + (note.kind === 'warn' ? 'warn' : note.kind === 'late' ? 'late' : note.kind === 'ok' ? 'ok' : ''),
            text: hint, title: dates.join(' · ') }),
          h('span', { class: 'acts' }, [
            h('button', { class: 'icon', text: '↑', title: tr('up'), disabled: dis || idx === 0, onclick: move(-1) }),
            h('button', { class: 'icon', text: '↓', title: tr('down'), disabled: dis || idx === state.st.length - 1, onclick: move(1) }),
            del
          ])
        ])
      ]);
    }

    function drawRows() {
      if (!state.st.length) {
        var kids = [h('div', { text: tr('empty') })];
        if (canWrite) {
          kids.push(h('div', { class: 'foot', style: 'justify-content:center' }, cfg.tpls.map(function (tpl) {
            return h('button', { text: tr('use_tpl', tpl.n), onclick: function () {
              state.st = MFM.fromTemplate(tpl).st; dirty = true; draw();
            } });
          })));
        }
        MFM.fill(rowsEl, [h('div', { class: 'empty' }, kids)]);
      } else {
        MFM.fill(rowsEl, [
          h('div', { class: 'stage head' }, [h('div', { class: 'l1' }, [
            h('span', { class: 'idx', text: '#' }), h('span', { text: tr('h_stage') }),
            h('span', { class: 'num', text: tr('h_amount') + ' (' + MFM.cur + ')' }), h('span', { text: tr('h_status') })
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
      syncEl = h('div');

      var contract = h('input', {
        type: 'text', class: 'amt', inputmode: 'decimal', placeholder: tr('optional'), disabled: !canWrite,
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
        MFM.demo ? h('div', { class: 'demo-banner', text: tr('demo') }) : null,
        summaryEl, barEl, rowsEl, errEl, syncEl,
        h('div', { class: 'foot' }, [
          h('button', { text: tr('add_stage'), disabled: !canWrite, onclick: function () {
            state.st.push(MFM.newStage('', 0)); dirty = true; draw();
            var names = root.querySelectorAll('input.name');
            if (names.length) names[names.length - 1].focus();
          } }),
          h('label', {}, [h('span', { text: tr('contract') }), contract]),
          h('span', { class: 'grow' }),
          saveEl
        ])
      ]);
      drawSummary(); drawRows(); drawSave(); drawErr(); drawSync();
    }

    // auto-save when the user clicks outside the schedule, so closing the card without pressing Save keeps the edits
    window.addEventListener('blur', function () { if (dirty && !saving && !conflict) save(); });

    return t.render(load);
  };
})();
