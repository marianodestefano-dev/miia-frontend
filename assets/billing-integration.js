/* global window, globalThis */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.BillingIntegration = factory(); }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var _config = null;

  function init(opts) {
    opts = opts || {};
    _config = {
      apiBase:      opts.apiBase      || '',
      getToken:     opts.getToken     || function() { return Promise.resolve(''); },
      onRedirect:   opts.onRedirect   || function(url) { window.location.href = url; },
      fetch:        opts.fetch        || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null),
    };
    return { initialized: true };
  }

  function subscribe(product) {
    if (!_config) { return Promise.reject(new Error('not_initialized')); }
    if (!product) { return Promise.reject(new Error('product_required')); }
    return Promise.resolve(_config.getToken()).then(function(token) {
      if (!token) { return Promise.reject(new Error('no_token')); }
      return _config.fetch(_config.apiBase + '/api/paypal/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ product: product }),
      });
    }).then(function(resp) {
      return resp.json().then(function(data) {
        if (!resp.ok) { throw new Error(data.error || 'subscribe_failed'); }
        return data;
      });
    }).then(function(data) {
      if (data.approvalUrl) {
        _config.onRedirect(data.approvalUrl);
      }
      return data;
    });
  }

  function cancelSubscription(subscriptionId, reason) {
    if (!_config) { return Promise.reject(new Error('not_initialized')); }
    if (!subscriptionId) { return Promise.reject(new Error('subscription_id_required')); }
    return Promise.resolve(_config.getToken()).then(function(token) {
      if (!token) { return Promise.reject(new Error('no_token')); }
      return _config.fetch(_config.apiBase + '/api/paypal/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ subscriptionId: subscriptionId, reason: reason || 'User requested' }),
      });
    }).then(function(resp) {
      return resp.json().then(function(data) {
        if (!resp.ok) { throw new Error(data.error || 'cancel_failed'); }
        return data;
      });
    });
  }

  var STATUS_LABELS = {
    active:         { label: 'Activo',          color: '#22c55e' },
    cancelled:      { label: 'Cancelado',        color: '#ef4444' },
    payment_failed: { label: 'Pago fallido',     color: '#f59e0b' },
    trial:          { label: 'Prueba gratuita',  color: '#00E5FF' },
  };

  function renderBillingStatus(data) {
    data = data || {};
    var status = data.payment_status || 'trial';
    var info = STATUS_LABELS[status] || { label: status, color: '#a1a1a6' };
    return {
      label:              info.label,
      color:              info.color,
      subscriptionId:     data.paypal_subscription_id || null,
      activatedAt:        data.activated_at           || null,
      cancelledAt:        data.cancelled_at           || null,
      planEndDate:        data.plan_end_date           || null,
      isActive:           status === 'active',
      isTrial:            status === 'trial',
      isCancelled:        status === 'cancelled',
      isPaymentFailed:    status === 'payment_failed',
    };
  }

  function _resetForTest() {
    _config = null;
  }

  return { init: init, subscribe: subscribe, cancelSubscription: cancelSubscription, renderBillingStatus: renderBillingStatus, _resetForTest: _resetForTest };
}));
