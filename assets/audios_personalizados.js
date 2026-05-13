// P3.3 Audios Personalizados (firma Mariano 2026-05-12)
// Owner graba/sube audios para 4 contextos predefinidos. MIIA los usa cuando
// detecta el contexto en conversaciones (NO MIIA CENTER, solo Personal + otros owners).
//
// API:
//   createAudiosPersonalizadosPanel(opts) -> { element, refresh }
//
// opts = {
//   uid: string,
//   getToken: () => Promise<string>,        // Firebase ID token
//   fetchFn: (url, init) => Promise<Response>, // default window.fetch
//   uploadFn: async (file, path) => string,  // sube a Firebase Storage, retorna URL
//   document?: Document,
//   apiBase?: string,                       // default ''
// }

(function(global) {
  'use strict';

  var CONTEXTS = [
    { key: 'lead_cuestiona_ia',     label: 'Lead cuestiona si es IA',
      description: 'Cuando el lead pregunta "¿sos IA?" o "¿es un bot?", MIIA manda tu audio.',
      suggestedScript: 'Hola Dr/Dra, no soy IA, soy [tu nombre]. Disculpa la demora, en este momento estoy subiendo al ascensor / en transporte. En unos minutos te respondo personalmente.' },
    { key: 'saludo_inicial_calido', label: 'Saludo inicial cálido',
      description: 'Cuando un lead nuevo escribe por primera vez, MIIA manda tu saludo de bienvenida.',
      suggestedScript: '¡Hola! Soy [tu nombre], gracias por escribirnos. En un momento te respondo personalmente.' },
    { key: 'compra_confirmada',     label: 'Compra confirmada',
      description: 'Al confirmar una compra/pedido, MIIA manda tu audio de confirmación.',
      suggestedScript: '¡Confirmado! Ya quedó registrado tu pedido. Recibirás los detalles en los próximos minutos. Gracias por tu confianza.' },
    { key: 'despedida_calida',      label: 'Despedida cálida',
      description: 'Al cerrar la conversación, MIIA manda tu despedida personalizada.',
      suggestedScript: '¡Gracias por escribir! Quedo atento por cualquier consulta. ¡Que tengas excelente día!' },
  ];

  function createAudiosPersonalizadosPanel(opts) {
    var o = opts || {};
    var doc = o.document || (typeof document !== 'undefined' ? document : null);
    var fetchFn = o.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(global) : null);
    var apiBase = o.apiBase || '';
    var getToken = o.getToken || function() { return Promise.resolve(null); };
    var uploadFn = o.uploadFn || null;
    var uid = o.uid || null;

    var el = doc ? doc.createElement('div') : null;
    if (el) el.className = 'audios-personalizados-panel';

    var _state = { audios: {}, loading: true, error: null };

    async function fetchAudios() {
      if (!uid || !fetchFn) {
        _state = { audios: {}, loading: false, error: 'no_uid' };
        render();
        return;
      }
      try {
        var token = await getToken();
        var url = apiBase + '/api/owner-voice?uid=' + encodeURIComponent(uid);
        var resp = await fetchFn(url, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
        if (!resp.ok) throw new Error('fetch_failed_' + resp.status);
        var data = await resp.json();
        var map = {};
        (data.audios || []).forEach(function(a) { map[a.context] = a; });
        _state = { audios: map, loading: false, error: null };
      } catch (e) {
        _state = { audios: {}, loading: false, error: e.message };
      }
      render();
    }

    function render() {
      if (!el) return;
      if (_state.loading) {
        el.innerHTML = '<div style="color:var(--text-3);padding:16px;">Cargando audios...</div>';
        return;
      }
      if (_state.error) {
        el.innerHTML = '<div style="color:var(--danger,#ef4444);padding:16px;">Error: ' + escapeHtml(_state.error) + '</div>';
        return;
      }
      var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
      CONTEXTS.forEach(function(ctx) {
        var existing = _state.audios[ctx.key];
        html += '<div class="audio-ctx-card" data-ctx="' + ctx.key + '" ' +
                'style="background:var(--bg-card,#141414);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:16px;">';
        html += '<div style="font-weight:700;color:var(--text-1,#F1F5F9);margin-bottom:4px;">' + escapeHtml(ctx.label) + '</div>';
        html += '<div style="font-size:13px;color:var(--text-3,#64748B);margin-bottom:10px;">' + escapeHtml(ctx.description) + '</div>';
        if (existing) {
          html += '<div style="margin-bottom:10px;">';
          html += '<audio controls src="' + escapeAttr(existing.fileUrl) + '" style="width:100%;"></audio>';
          html += '<div style="font-size:11px;color:var(--text-muted,#64748B);margin-top:6px;">Duración: ' +
                  (existing.durationSec || '?') + 's</div>';
          html += '</div>';
          html += '<div style="display:flex;gap:8px;">';
          html += '<button class="btn-replace" data-ctx="' + ctx.key + '" style="padding:8px 14px;background:transparent;border:1px solid var(--border,rgba(255,255,255,.1));border-radius:9999px;color:var(--text-1,#F1F5F9);cursor:pointer;font-size:12px;">Reemplazar</button>';
          html += '<button class="btn-delete" data-ctx="' + ctx.key + '" style="padding:8px 14px;background:transparent;border:1px solid rgba(239,68,68,.3);border-radius:9999px;color:#ef4444;cursor:pointer;font-size:12px;">Eliminar</button>';
          html += '</div>';
        } else {
          html += '<details style="margin-bottom:10px;"><summary style="cursor:pointer;font-size:12px;color:var(--text-2,#94A3B8);">Ver guion sugerido</summary>';
          html += '<p style="font-size:13px;color:var(--text-2,#94A3B8);font-style:italic;margin:6px 0;">' + escapeHtml(ctx.suggestedScript) + '</p></details>';
          html += '<label class="btn-upload" data-ctx="' + ctx.key + '" style="display:inline-block;padding:10px 18px;background:linear-gradient(135deg,#00E5FF,#7C3AED);color:white;border-radius:9999px;cursor:pointer;font-size:13px;font-weight:600;">Subir audio<input type="file" accept="audio/*" data-ctx="' + ctx.key + '" style="display:none;"></label>';
        }
        html += '</div>';
      });
      html += '</div>';
      el.innerHTML = html;
      wireEvents();
    }

    function wireEvents() {
      if (!el) return;
      var inputs = el.querySelectorAll('input[type="file"]');
      inputs.forEach(function(input) {
        input.addEventListener('change', function(ev) {
          var file = ev.target.files && ev.target.files[0];
          if (!file) return;
          var ctx = ev.target.getAttribute('data-ctx');
          handleUpload(ctx, file);
        });
      });
      var replaceBtns = el.querySelectorAll('.btn-replace');
      replaceBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var ctx = btn.getAttribute('data-ctx');
          // trigger file input synthetic
          var input = doc.createElement('input');
          input.type = 'file';
          input.accept = 'audio/*';
          input.addEventListener('change', function(ev) {
            var file = ev.target.files && ev.target.files[0];
            if (file) handleUpload(ctx, file);
          });
          input.click();
        });
      });
      var deleteBtns = el.querySelectorAll('.btn-delete');
      deleteBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var ctx = btn.getAttribute('data-ctx');
          handleDelete(ctx);
        });
      });
    }

    async function handleUpload(ctx, file) {
      if (!uploadFn) {
        alert('Upload no configurado. Definí opts.uploadFn al crear el panel.');
        return;
      }
      try {
        _state.loading = true; render();
        var path = 'owner-voice/' + uid + '/' + ctx + '_' + Date.now() + '_' + file.name;
        var fileUrl = await uploadFn(file, path);
        var durationSec = await measureDuration(file);
        var token = await getToken();
        var resp = await fetchFn(apiBase + '/api/owner-voice', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
          body: JSON.stringify({ uid: uid, context: ctx, fileUrl: fileUrl, transcript: '', durationSec: durationSec }),
        });
        if (!resp.ok) {
          var err = await resp.json().catch(function() { return { error: 'unknown' }; });
          throw new Error(err.error || 'upload_failed');
        }
        await fetchAudios();
      } catch (e) {
        _state.loading = false; _state.error = e.message; render();
      }
    }

    async function handleDelete(ctx) {
      if (!fetchFn || !uid) return;
      try {
        var token = await getToken();
        var resp = await fetchFn(apiBase + '/api/owner-voice/' + ctx + '?uid=' + encodeURIComponent(uid), {
          method: 'DELETE',
          headers: token ? { Authorization: 'Bearer ' + token } : {},
        });
        if (!resp.ok) throw new Error('delete_failed_' + resp.status);
        await fetchAudios();
      } catch (e) {
        _state.error = e.message; render();
      }
    }

    function measureDuration(file) {
      return new Promise(function(resolve) {
        if (!doc || typeof doc.createElement !== 'function') return resolve(10);
        try {
          var audio = doc.createElement('audio');
          audio.preload = 'metadata';
          audio.onloadedmetadata = function() {
            resolve(Math.round(audio.duration) || 10);
          };
          audio.onerror = function() { resolve(10); };
          audio.src = URL.createObjectURL(file);
        } catch (e) {
          resolve(10);
        }
      });
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function escapeAttr(s) { return escapeHtml(s); }

    fetchAudios();
    return { element: el, refresh: fetchAudios, _getState: function() { return _state; } };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = createAudiosPersonalizadosPanel;
  } else if (global) {
    global.createAudiosPersonalizadosPanel = createAudiosPersonalizadosPanel;
  }
  /* v8 ignore next 1 */
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
