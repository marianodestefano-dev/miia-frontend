'use strict';

/**
 * f1-companion-integration.js (VI-INTG-F1-PANELS)
 * Wrapper que integra los 3 paneles F1 live: sectors, gap, telemetry.
 * Cero dependencias externas — pensado para browser y tests Node.
 */

var _cfg = null;
var _panels = { sectors: null, gap: null, telemetry: null };

function _callLoad(panel, panelName, loadMethod) {
  if (!panel || typeof panel[loadMethod] !== 'function') return;
  panel[loadMethod]().catch(function(err) {
    console.warn('[F1-INTG] ' + panelName + ' load error:', err.message || err);
  });
}

/**
 * Inicializa la integración con la configuración dada.
 * @param {Object} opts
 * @returns {{ initialized: true }}
 */
function init(opts) {
  _cfg = opts || {};
  _panels = { sectors: null, gap: null, telemetry: null };
  return { initialized: true };
}

/**
 * Monta los 3 paneles en sus hosts. Llama load inicial si el panel lo soporta.
 * @returns {{ sectors, gap, telemetry }}
 */
function mountPanels() {
  if (!_cfg) return { sectors: null, gap: null, telemetry: null };

  function mountOne(factoryKey, hostKey, panelName, loadMethod) {
    var factory = _cfg[factoryKey];
    if (typeof factory !== 'function') return null;
    var panel;
    try {
      panel = factory();
    } catch (e) {
      console.warn('[F1-INTG] ' + panelName + ' factory error:', e.message || e);
      return null;
    }
    var host = _cfg[hostKey];
    if (host && panel && panel.element) {
      host.appendChild(panel.element);
    }
    _callLoad(panel, panelName, loadMethod);
    return panel;
  }

  _panels.sectors   = mountOne('createSectorsPanel',   'sectorsMount',   'sectors',   'loadSectors');
  _panels.gap       = mountOne('createGapPanel',       'gapMount',       'gap',       'loadIntervals');
  _panels.telemetry = mountOne('createTelemetryPanel', 'telemetryMount', 'telemetry', 'loadTelemetry');


  return { sectors: _panels.sectors, gap: _panels.gap, telemetry: _panels.telemetry };
}

/**
 * Fuerza recarga de datos en los 3 paneles montados.
 */
function refreshAll() {
  _callLoad(_panels.sectors,   'sectors',   'loadSectors');
  _callLoad(_panels.gap,       'gap',        'loadIntervals');
  _callLoad(_panels.telemetry, 'telemetry', 'loadTelemetry');
}

/** Solo para tests. */
function _resetForTest() {
  _cfg = null;
  _panels = { sectors: null, gap: null, telemetry: null };
}

module.exports = { init: init, mountPanels: mountPanels, refreshAll: refreshAll, _resetForTest: _resetForTest };
