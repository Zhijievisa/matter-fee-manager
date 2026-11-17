/* Matter Fee Manager — page start-up.
 * Kept in its own file so no page needs an inline <script> (required for a strict Content-Security-Policy).
 * Each page marks its root element with data-mount="<name of the MFM mount function>".
 */
(function () {
  'use strict';
  var root = document.getElementById('mfm-root');
  if (!root || !window.MFM) return;
  var mount = window.MFM[root.getAttribute('data-mount')];
  if (typeof mount !== 'function') return;
  var t = window.MFM.getT();
  window.MFM.applyTheme(t);
  mount(t, root);
})();
