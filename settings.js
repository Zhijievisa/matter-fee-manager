/* Matter Fee Manager — board settings (Power-Up gear → Settings) */
(function () {
  'use strict';
  var MFM = window.MFM, h = MFM.h, tr = MFM.tr;

  MFM.mountSettings = function (t, root) {
    var cfg, msg = null;
    var drafts = []; // [{name, text}]
    var rest = MFM.rest(t), authed = false, fields = null, fsMsg = '';

    function resize() { try { t.sizeTo('#' + root.id); } catch (e) { /* demo mode */ } }

    /* ---------- optional status field (see shared.js) ---------- */
    function loadFields() {
      return rest.token().then(function (token) {
        authed = !!token;
        if (!token) { fields = null; return null; }
        return MFM.textFields(t, token).then(function (list) { fields = list; fsMsg = ''; }, function (e) {
          if (e && e.status === 401) { authed = false; fields = null; return rest.clear(); }
          fields = []; fsMsg = tr('fs_load_err', e && e.message ? e.message : tr('err_unknown'));
          return null;
        });
      }).then(draw, draw);
    }
    function syncBlock() {
      if (!rest.ok) return null;
      var kids = [h('label', { text: tr('fs_title') }), h('div', { class: 'muted small', text: tr('fs_help') })];
      if (!authed) {
        if (cfg.sync) kids.push(h('div', { class: 'small', text: cfg.sync.fn }));
        // authorize() is called straight from the click so the browser allows Trello's consent window
        kids.push(h('div', { class: 'foot' }, [h('button', { type: 'button', text: tr('fs_authorize'), onclick: function () {
          rest.authorize().then(function (tok) {
            if (!tok) { fsMsg = tr('fs_denied'); draw(); return null; }
            fsMsg = '';
            return loadFields();
          }).catch(function () { fsMsg = tr('fs_denied'); draw(); });
        } })]));
      } else {
        var list = fields || [];
        var opts = [['', tr('fs_off')]].concat(list.map(function (f) { return [f.id, f.name]; }));
        if (cfg.sync && !list.some(function (f) { return f.id === cfg.sync.fid; })) opts.push([cfg.sync.fid, tr('fs_missing', cfg.sync.fn)]);
        var sel = h('select', { style: 'max-width:280px', onchange: function () {
          var f = list.filter(function (x) { return x.id === sel.value; })[0];
          if (!sel.value) delete cfg.sync;
          else cfg.sync = { fid: sel.value, fn: f ? f.name : (cfg.sync ? cfg.sync.fn : '') };
        } }, opts.map(function (o) {
          var el = h('option', { value: o[0], text: o[1] });
          if ((cfg.sync ? cfg.sync.fid : '') === o[0]) el.selected = true;
          return el;
        }));
        kids.push(h('div', { class: 'foot' }, [
          sel,
          h('button', { type: 'button', text: tr('fs_refresh'), onclick: loadFields }),
          h('button', { type: 'button', text: tr('fs_revoke'), onclick: function () { rest.clear().then(loadFields); } })
        ]));
        if (fields && !fields.length && !fsMsg) kids.push(h('div', { class: 'note info', text: tr('fs_nofields') }));
      }
      if (fsMsg) kids.push(h('div', { class: 'note err', text: fsMsg }));
      return h('div', { class: 'field' }, kids);
    }

    function draw() {
      MFM.useCfg(cfg);

      var lang = h('select', { style: 'max-width:280px', onchange: function () { cfg.lang = lang.value; draw(); } },
        [['auto', tr('s_lang_auto')], ['en', 'English'], ['zh', '简体中文']].map(function (o) {
          var el = h('option', { value: o[0], text: o[1] });
          if (cfg.lang === o[0]) el.selected = true;
          return el;
        }));
      var cur = h('input', { type: 'text', value: cfg.cur, maxlength: '4', style: 'width:90px',
        oninput: function () { cfg.cur = cur.value.trim() || '$'; } });
      var terms = h('input', { type: 'number', min: '0', max: '365', value: String(cfg.terms), style: 'width:90px',
        oninput: function () { var v = parseInt(terms.value, 10); if (isFinite(v) && v >= 0) cfg.terms = v; } });

      var tplEls = drafts.map(function (d, i) {
        var name = h('input', { type: 'text', value: d.name, placeholder: tr('ph_tpl_name'), maxlength: '40',
          oninput: function () { d.name = name.value; } });
        var text = h('textarea', { placeholder: tr('ph_tpl_lines'), oninput: function () { d.text = text.value; } });
        text.value = d.text;
        return h('div', { class: 'tpl' }, [
          h('div', { class: 'row' }, [name, h('button', { class: 'icon', text: '✕', title: tr('del_tpl'), onclick: function () { drafts.splice(i, 1); draw(); } })]),
          text
        ]);
      });

      MFM.fill(root, [
        h('div', { class: 'field' }, [h('label', { text: tr('s_lang') }), lang]),
        h('div', { class: 'field two' }, [
          h('div', {}, [h('label', { text: tr('s_cur') }), cur]),
          h('div', {}, [h('label', { text: tr('s_terms') }), terms, h('span', { class: 'muted', text: tr('s_days') })])
        ]),
        h('div', { class: 'field' }, [h('label', { text: tr('s_tpls') })].concat(tplEls).concat([
          h('button', { text: tr('new_tpl'), onclick: function () { drafts.push({ name: '', text: '' }); draw(); } })
        ])),
        syncBlock(),
        msg ? h('div', { class: 'note ' + msg.kind, text: msg.text }) : null,
        h('div', { class: 'foot' }, [
          h('span', { class: 'muted small' }, [
            tr('about', MFM.VERSION) + ' ',
            h('a', { class: 'link', href: './privacy.html', target: '_blank', rel: 'noopener', text: tr('privacy') }), ' · ',
            h('a', { class: 'link', href: './support.html', target: '_blank', rel: 'noopener', text: tr('support') })
          ]),
          h('span', { class: 'grow' }),
          h('button', { class: 'primary', text: tr('save_settings'), onclick: save })
        ])
      ]);
      resize();
    }

    function save() {
      var out = { lang: cfg.lang, cur: cfg.cur, terms: cfg.terms, tpls: [] }, problems = [];
      // the status line is always written in the language the board shows at the moment it is switched on
      if (cfg.sync) out.sync = { fid: cfg.sync.fid, fn: cfg.sync.fn, l: MFM.lang };
      drafts.forEach(function (d, i) {
        var name = d.name.trim();
        var parsed = MFM.parseTemplateLines(d.text);
        if (!name && !d.text.trim()) return; // ignore empty templates
        if (!name) problems.push(tr('e_noname', i + 1));
        if (parsed.badLines.length) problems.push(tr('e_badline', name || tr('e_tplname', i + 1), parsed.badLines.join(', ')));
        out.tpls.push({ n: name, st: parsed.stages });
      });
      if (problems.length) { msg = { kind: 'err', text: problems.join('; ') }; draw(); return; }
      if (MFM.sizeOf(out) > MFM.SIZE_LIMIT) { msg = { kind: 'err', text: tr('e_size') }; draw(); return; }
      t.set('board', 'shared', MFM.CFG_KEY, out).then(function () {
        msg = { kind: 'info', text: tr('saved') }; draw();
        return t.closePopup();
      }, function (err) {
        msg = { kind: 'err', text: tr('err_save', err && err.message ? err.message : tr('err_unknown')) }; draw();
      });
    }

    return t.get('board', 'shared', MFM.CFG_KEY).then(function (raw) {
      cfg = MFM.cfg(raw);
      drafts = cfg.tpls.map(function (tpl) { return { name: tpl.n, text: MFM.templateToText(tpl) }; });
      draw();
      if (rest.ok) return loadFields();
      return null;
    });
  };
})();
