/* global window, globalThis */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.F1CompanionIntegration = factory(); }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var _config = null;
  var _sectorsPanel = null;
  var _gapPanel = null;
  var _telemetryPanel = null;

  function init(opts) {
    opts = opts || {};
    _config = {
      sectorsMount:          opts.sectorsMount          || null,
      gapMount:              opts.gapMount              || null,
      telemetryMount:        opts.telemetryMount        || null,
      getToken:              opts.getToken              || function () { return Promise.resolve(''); },
      apiBase:               opts.apiBase               || '',
      createSectorsPanel:    opts.createSectorsPanel    || null,
      createGapPanel:        opts.createGapPanel        || null,
      createTelemetryPanel:  opts.createTelemetryPanel  || null,
    };
    return { initialized: true };
  }

  function _mountOne(createFn, host) {
    if (!createFn) { return null; }
    var panel;
    try {
      panel = createFn();
    } catch (e) {
      return null;
    }
    if (host && panel.element) {
      host.innerHTML = '';
      host.appendChild(panel.element);
    }
    return panel;
  }

  function mountPanels() {
    if (!_config) { return { sectors: null, gap: null, telemetry: null }; }

    _sectorsPanel   = _mountOne(_config.createSectorsPanel,   _config.sectorsMount);
    _gapPanel       = _mountOne(_config.createGapPanel,       _config.gapMount);
    _telemetryPanel = _mountOne(_config.createTelemetryPanel, _config.telemetryMount);

    if (_sectorsPanel   && _sectorsPanel.loadSectors)    { _sectorsPanel.loadSectors().catch(_warnFail.bind(null, 'sectors')); }
    if (_gapPanel       && _gapPanel.loadIntervals)      { _gapPanel.loadIntervals().catch(_warnFail.bind(null, 'gap')); }
    if (_telemetryPanel && _telemetryPanel.loadTelemetry){ _telemetryPanel.loadTelemetry().catch(_warnFail.bind(null, 'telemetry')); }

    return { sectors: _sectorsPanel, gap: _gapPanel, telemetry: _telemetryPanel };
  }

  function refreshAll() {
    if (_sectorsPanel   && _sectorsPanel.loadSectors)    { _sectorsPanel.loadSectors().catch(_warnFail.bind(null, 'sectors')); }
    if (_gapPanel       && _gapPanel.loadIntervals)      { _gapPanel.loadIntervals().catch(_warnFail.bind(null, 'gap')); }
    if (_telemetryPanel && _telemetryPanel.loadTelemetry){ _telemetryPanel.loadTelemetry().catch(_warnFail.bind(null, 'telemetry')); }
  }

  function _warnFail(name, err) {
    console.warn('[F1CompanionIntegration] ' + name + ' refresh fail', err && err.message);
  }

  function _resetForTest() {
    _config = null;
    _sectorsPanel = null;
    _gapPanel = null;
    _telemetryPanel = null;
  }

  return { init: init, mountPanels: mountPanels, refreshAll: refreshAll, _resetForTest: _resetForTest };
}));
