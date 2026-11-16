/* Matter Fee Manager — board settings (Power-Up gear → Settings) */
(function () {
  'use strict';
  var MFM = window.MFM, h = MFM.h;

  MFM.mountSettings = function (t, root) {
    var cfg, msg = null;
    var drafts = []; // [{name, text}]

    function resize() { try { t.sizeTo('#' + root.id); } catch (e) { /* demo mode */ } }

    function draw() {
      var terms = h('input', { type: 'number', min: '0', max: '90', value: String(cfg.terms), style: 'width:90px',
        oninput: function () { var v = parseInt(terms.value, 10); if (isFinite(v) && v >= 0) cfg.terms = v; } });

      var tplEls = drafts.map(function (d, i) {
        var name = h('input', { type: 'text', value: d.name, placeholder: 'Template name (e.g. 482 three-stage)', maxlength: '40',
          oninput: function () { d.name = name.value; } });
        var text = h('textarea', { placeholder: 'One stage per line: Stage name | amount\ne.g. Application lodged | 2200',
          oninput: function () { d.text = text.value; } });
        text.value = d.text;
        return h('div', { class: 'tpl' }, [
          h('div', { class: 'row' }, [name, h('button', { class: 'icon', text: '✕', title: 'Delete template', onclick: function () { drafts.splice(i, 1); draw(); } })]),
          text
        ]);
      });

      MFM.fill(root, [
        h('div', { class: 'field' }, [
          h('label', { text: 'Default payment terms (days from invoice to due date)' }),
          terms, h('span', { class: 'muted', text: ' days' })
        ]),
        h('div', { class: 'field' }, [
          h('label', { text: 'Stage templates (one per line: Stage name | amount; use 0 to fill in later)' })
        ].concat(tplEls).concat([
          h('button', { text: '+ New template', onclick: function () { drafts.push({ name: '', text: '' }); draw(); } })
        ])),
        msg ? h('div', { class: 'note ' + msg.kind, text: msg.text }) : null,
        h('div', { class: 'foot' }, [
          h('span', { class: 'grow' }),
          h('button', { class: 'primary', text: 'Save settings', onclick: save })
        ])
      ]);
      resize();
    }

    function save() {
      var out = { terms: cfg.terms, tpls: [] }, problems = [];
      drafts.forEach(function (d, i) {
        var name = d.name.trim();
        var parsed = MFM.parseTemplateLines(d.text);
        if (!name && !parsed.stages.length && !d.text.trim()) return; // ignore empty templates
        if (!name) problems.push('Template ' + (i + 1) + ' has no name');
        if (parsed.badLines.length) problems.push('"' + (name || 'Template ' + (i + 1)) + '": line ' + parsed.badLines.join(', ') + ' is not valid');
        out.tpls.push({ n: name, st: parsed.stages });
      });
      if (problems.length) { msg = { kind: 'err', text: problems.join('; ') + '.' }; draw(); return; }
      if (MFM.sizeOf(out) > MFM.SIZE_LIMIT) { msg = { kind: 'err', text: 'The templates exceed Trello\'s board storage limit (about 4,000 characters). Please trim them.' }; draw(); return; }
      t.set('board', 'shared', MFM.CFG_KEY, out).then(function () {
        msg = { kind: 'info', text: 'Saved.' }; draw();
        return t.closePopup();
      }, function (err) {
        msg = { kind: 'err', text: 'Save failed: ' + (err && err.message ? err.message : 'unknown error') }; draw();
      });
    }

    return t.get('board', 'shared', MFM.CFG_KEY).then(function (raw) {
      cfg = MFM.cfg(raw);
      drafts = cfg.tpls.map(function (tpl) { return { name: tpl.n, text: MFM.templateToText(tpl) }; });
      draw();
    });
  };
})();
