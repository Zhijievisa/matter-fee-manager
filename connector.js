/* Matter Fee Manager — iframe connector (loaded by index.html, runs only in Trello's hidden iframe) */
(function () {
  'use strict';
  var MFM = window.MFM;
  var BASE = window.location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
  var ICON_GRAY = BASE + 'icon.svg';
  var ICON_WHITE = BASE + 'icon-white.svg';

  function openOverview(t) {
    return t.modal({
      url: './overview.html',
      title: 'Matter Fee · Receivables',
      height: 640,
      fullscreen: false
    });
  }

  function createTable(t, tpl) {
    var fee = tpl ? MFM.fromTemplate(tpl) : { v: 1, st: [MFM.newStage('', 0)] };
    return t.set('card', 'shared', MFM.KEY, MFM.compact(fee)).then(function () { return t.closePopup(); });
  }

  function appendTemplate(t, tpl) {
    return t.get('card', 'shared', MFM.KEY).then(function (raw) {
      var fee = MFM.normalize(raw);
      fee.st = fee.st.concat(MFM.fromTemplate(tpl).st);
      var payload = MFM.compact(fee);
      if (MFM.sizeOf(payload) > MFM.SIZE_LIMIT) {
        return t.alert({ message: 'Too many stages: this would exceed Trello\'s per-card storage limit. Nothing was added.', duration: 6, display: 'error' });
      }
      return t.set('card', 'shared', MFM.KEY, payload);
    }).then(function () { return t.closePopup(); });
  }

  function confirmDelete(t) {
    return t.popup({
      type: 'confirm',
      title: 'Delete fee schedule',
      message: 'This deletes every fee stage recorded on this card. It cannot be undone.',
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: function (t) {
        return t.remove('card', 'shared', MFM.KEY).then(function () { return t.closePopup(); });
      },
      cancelText: 'Cancel',
      onCancel: function (t) { return t.closePopup(); }
    });
  }

  function cardMenu(t) {
    return Promise.all([
      t.get('card', 'shared', MFM.KEY),
      t.get('board', 'shared', MFM.CFG_KEY)
    ]).then(function (r) {
      var fee = r[0], cfg = MFM.cfg(r[1]), items = [];
      if (!fee) {
        items.push({ text: 'New blank fee schedule', callback: function (t) { return createTable(t, null); } });
        cfg.tpls.forEach(function (tpl) {
          items.push({ text: 'Use template: ' + tpl.n, callback: function (t) { return createTable(t, tpl); } });
        });
      } else {
        cfg.tpls.forEach(function (tpl) {
          items.push({ text: 'Append template stages: ' + tpl.n, callback: function (t) { return appendTemplate(t, tpl); } });
        });
        items.push({ text: 'Delete this card\'s fee schedule…', callback: confirmDelete });
      }
      items.push({ text: 'Open receivables overview', callback: openOverview });
      return t.popup({ title: 'Matter Fee', items: items });
    });
  }

  // Known issue TRELLO-1820: with a card open, the 'card' scope inside card-badges can resolve to the wrong card,
  // so badges always read data by the card ID from the context.
  function feeOfContextCard(t) {
    var ctx = t.getContext() || {};
    return t.get(ctx.card || 'card', 'shared', MFM.KEY);
  }

  window.TrelloPowerUp.initialize({
    'card-badges': function (t) {
      return feeOfContextCard(t).then(function (fee) { return MFM.badges(fee); });
    },

    'card-detail-badges': function (t) {
      return feeOfContextCard(t).then(function (fee) {
        if (!fee) return [];
        var r = MFM.summarize(fee);
        if (!r.n) return [];
        var color = r.overdue > 0 ? 'red' : (r.receivable > 0 ? 'orange' : (r.paid === r.sum && r.sum > 0 ? 'green' : null));
        var badge = { title: 'Fee progress', text: 'Paid ' + MFM.fmtMoney(r.paid, true) + ' / ' + MFM.fmtMoney(r.sum, true) };
        if (color) badge.color = color;
        var out = [badge];
        if (r.receivable > 0) out.push({ title: 'Receivable now', text: MFM.fmtMoney(r.receivable, true), color: r.overdue > 0 ? 'red' : 'orange' });
        return out;
      });
    },

    'card-buttons': function () {
      return [{ icon: ICON_GRAY, text: 'Fee schedule', callback: cardMenu }];
    },

    'card-back-section': function (t) {
      return t.get('card', 'shared', MFM.KEY).then(function (fee) {
        if (!fee) return null; // cards without a fee schedule do not show this section
        return {
          title: 'Staged fee schedule',
          icon: ICON_GRAY,
          content: { type: 'iframe', url: t.signUrl('./section.html'), height: 260 }
        };
      });
    },

    'board-buttons': function () {
      return [{
        icon: { dark: ICON_WHITE, light: ICON_GRAY },
        text: 'Receivables',
        callback: openOverview
      }];
    },

    'show-settings': function (t) {
      return t.popup({ title: 'Matter Fee settings', url: './settings.html', height: 460 });
    }
  });
})();
