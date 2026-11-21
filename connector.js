/* Matter Fee Manager — iframe connector (loaded by index.html, runs only in Trello's hidden iframe) */
(function () {
  'use strict';
  var MFM = window.MFM, tr = MFM.tr;
  if (!window.TrelloPowerUp) return; // opened directly, outside Trello: nothing to do
  var BASE = window.location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
  var ICON_GRAY = BASE + 'icon.svg';
  var ICON_WHITE = BASE + 'icon-white.svg';

  // Reads the board settings first so labels come out in the board's language and currency.
  function withCfg(t) {
    return t.get('board', 'shared', MFM.CFG_KEY).then(function (raw) { return MFM.cfg(raw); });
  }

  // If Trello's storage call fails (for example a gateway timeout), tell the user instead of
  // leaving an unhandled rejection behind.
  function saveFailed(t) {
    return function (err) {
      return t.alert({ message: tr('err_save', err && err.message ? err.message : tr('err_unknown')), duration: 8, display: 'error' });
    };
  }

  function openOverview(t) {
    return t.modal({ url: './overview.html', title: tr('ov_title'), height: 640, fullscreen: false });
  }

  function createTable(t, tpl) {
    var fee = tpl ? MFM.fromTemplate(tpl) : { v: 1, rv: 0, st: [MFM.newStage('', 0)] };
    fee.rv = 1;
    return t.set('card', 'shared', MFM.KEY, MFM.compact(fee)).then(function () { return t.closePopup(); }, saveFailed(t));
  }

  function appendTemplate(t, tpl) {
    return t.get('card', 'shared', MFM.KEY).then(function (raw) {
      var fee = MFM.normalize(raw);
      fee.st = fee.st.concat(MFM.fromTemplate(tpl).st);
      fee.rv = (fee.rv || 0) + 1;
      var payload = MFM.compact(fee);
      if (MFM.sizeOf(payload) > MFM.SIZE_LIMIT) {
        return t.alert({ message: tr('too_many'), duration: 6, display: 'error' });
      }
      return t.set('card', 'shared', MFM.KEY, payload).then(function () { return t.closePopup(); });
    }).catch(saveFailed(t));
  }

  function confirmDelete(t) {
    return t.popup({
      type: 'confirm',
      title: tr('del_title'),
      message: tr('del_msg'),
      confirmText: tr('del_ok'),
      confirmStyle: 'danger',
      onConfirm: function (t) {
        var card = (t.getContext() || {}).card;
        return t.remove('card', 'shared', MFM.KEY).then(function () {
          // clear the optional status field too (does nothing unless it is switched on and authorized)
          return withCfg(t).then(function (cfg) { return MFM.syncStatus(t, card, null, cfg); });
        }).then(function () { return t.closePopup(); }, saveFailed(t));
      },
      cancelText: tr('cancel'),
      onCancel: function (t) { return t.closePopup(); }
    });
  }

  function cardMenu(t) {
    return Promise.all([t.get('card', 'shared', MFM.KEY), withCfg(t)]).then(function (r) {
      var fee = r[0], cfg = r[1], items = [];
      if (!fee) {
        items.push({ text: tr('new_blank'), callback: function (t) { return createTable(t, null); } });
        cfg.tpls.forEach(function (tpl) {
          items.push({ text: tr('use_tpl', tpl.n), callback: function (t) { return createTable(t, tpl); } });
        });
      } else {
        cfg.tpls.forEach(function (tpl) {
          items.push({ text: tr('append_tpl', tpl.n), callback: function (t) { return appendTemplate(t, tpl); } });
        });
        items.push({ text: tr('del_menu'), callback: confirmDelete });
      }
      items.push({ text: tr('open_ov'), callback: openOverview });
      return t.popup({ title: 'Matter Fee', items: items });
    });
  }

  // Known issue TRELLO-1820: with a card open, the 'card' scope inside card-badges can resolve to the
  // wrong card, so badges always read data by the card ID taken from the context.
  function feeOfContextCard(t) {
    var ctx = t.getContext() || {};
    return t.get(ctx.card || 'card', 'shared', MFM.KEY);
  }

  window.TrelloPowerUp.initialize({
    'card-badges': function (t) {
      if (!MFM.canSee(t)) return [];
      return Promise.all([feeOfContextCard(t), withCfg(t)]).then(function (r) { return MFM.badges(r[0]); });
    },

    'card-detail-badges': function (t) {
      if (!MFM.canSee(t)) return [];
      return Promise.all([feeOfContextCard(t), withCfg(t)]).then(function (res) {
        var fee = res[0];
        if (!fee) return [];
        var r = MFM.summarize(fee);
        if (!r.n || r.sum === 0) return [];
        var color = r.overdue > 0 ? 'red' : (r.receivable > 0 ? 'orange' : (r.paid === r.sum ? 'green' : null));
        var badge = { title: tr('fee_progress'), text: tr('bd_prog', MFM.fmtMoney(r.paid, true), MFM.fmtMoney(r.sum, true)) };
        if (color) badge.color = color;
        var out = [badge];
        if (r.receivable > 0) out.push({ title: tr('recv_now'), text: MFM.fmtMoney(r.receivable, true), color: r.overdue > 0 ? 'red' : 'orange' });
        return out;
      });
    },

    'card-buttons': function (t) {
      if (!MFM.canSee(t)) return [];
      return withCfg(t).then(function () {
        return [{ icon: ICON_GRAY, text: tr('btn_fee'), callback: cardMenu }];
      });
    },

    'card-back-section': function (t) {
      if (!MFM.canSee(t)) return null;
      return Promise.all([t.get('card', 'shared', MFM.KEY), withCfg(t)]).then(function (r) {
        if (!r[0]) return null; // cards without a fee schedule do not show this section
        return {
          title: tr('sec_title'),
          icon: ICON_GRAY,
          content: { type: 'iframe', url: t.signUrl('./section.html'), height: 260 }
        };
      });
    },

    'board-buttons': function (t) {
      if (!MFM.canSee(t)) return [];
      return withCfg(t).then(function () {
        return [{ icon: { dark: ICON_WHITE, light: ICON_GRAY }, text: tr('btn_recv'), callback: openOverview }];
      });
    },

    // Shown once, right after someone enables the Power-Up on a board.
    'on-enable': function (t) {
      return withCfg(t).then(function () {
        return t.modal({ url: './welcome.html', title: tr('wel_title'), height: 430, fullscreen: false });
      });
    },

    'show-settings': function (t) {
      return withCfg(t).then(function () {
        return t.popup({ title: tr('set_title'), url: './settings.html', height: 560 });
      });
    }
  }, MFM.appOpts());
})();
