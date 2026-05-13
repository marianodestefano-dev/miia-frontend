import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createPanel = require('../assets/audios_personalizados.js');

function mockResponse(body, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('audios_personalizados', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('createAudiosPersonalizadosPanel', () => {
    test('crea element HTMLElement', () => {
      const p = createPanel({ uid: 'u1', fetchFn: vi.fn(() => mockResponse({ audios: [] })) });
      expect(p.element).toBeInstanceOf(HTMLElement);
      expect(p.element.className).toBe('audios-personalizados-panel');
    });

    test('expone refresh + _getState', () => {
      const p = createPanel({ uid: 'u1', fetchFn: vi.fn(() => mockResponse({ audios: [] })) });
      expect(typeof p.refresh).toBe('function');
      expect(typeof p._getState).toBe('function');
    });

    test('sin uid -> state.error=no_uid', async () => {
      const p = createPanel({ uid: null });
      await new Promise(r => setTimeout(r, 30));
      expect(p._getState().error).toBe('no_uid');
    });

    test('sin fetchFn (mocked global) -> state.error o no-crash', async () => {
      // Note: si global.fetch existe (happy-dom), no se setea no_uid. Solo verificamos que no crashea.
      const p = createPanel({ uid: 'u1', fetchFn: undefined });
      await new Promise(r => setTimeout(r, 30));
      // No crash es lo importante; estado puede ser loading=false con error o no.
      expect(p._getState().loading).toBe(false);
    });
  });

  describe('fetchAudios', () => {
    test('fetch OK + 1 audio -> render audio existente', async () => {
      const fetchFn = vi.fn(() => mockResponse({
        audios: [
          { context: 'lead_cuestiona_ia', fileUrl: 'https://s/ia.mp3', durationSec: 12 },
        ],
      }));
      const p = createPanel({
        uid: 'u1',
        fetchFn,
        getToken: async () => 'tok123',
      });
      await new Promise(r => setTimeout(r, 30));
      expect(fetchFn).toHaveBeenCalledWith(
        '/api/owner-voice?uid=u1',
        { headers: { Authorization: 'Bearer tok123' } }
      );
      const audioEl = p.element.querySelector('audio');
      expect(audioEl).toBeTruthy();
      expect(audioEl.getAttribute('src')).toBe('https://s/ia.mp3');
    });

    test('fetch sin token -> headers vacios', async () => {
      const fetchFn = vi.fn(() => mockResponse({ audios: [] }));
      createPanel({ uid: 'u1', fetchFn, getToken: async () => null });
      await new Promise(r => setTimeout(r, 30));
      expect(fetchFn).toHaveBeenCalledWith(
        '/api/owner-voice?uid=u1',
        { headers: {} }
      );
    });

    test('fetch !ok -> state.error con codigo', async () => {
      const fetchFn = vi.fn(() => mockResponse({}, false, 500));
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      expect(p._getState().error).toBe('fetch_failed_500');
    });

    test('fetch throws -> state.error con message', async () => {
      const fetchFn = vi.fn(() => Promise.reject(new Error('network-down')));
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      expect(p._getState().error).toBe('network-down');
    });

    test('apiBase custom -> URL con prefijo', async () => {
      const fetchFn = vi.fn(() => mockResponse({ audios: [] }));
      createPanel({ uid: 'u1', fetchFn, apiBase: 'https://api.test' });
      await new Promise(r => setTimeout(r, 30));
      expect(fetchFn.mock.calls[0][0]).toContain('https://api.test/api/owner-voice');
    });
  });

  describe('render', () => {
    test('sin audios -> muestra los 4 contextos firmados', async () => {
      const p = createPanel({ uid: 'u1', fetchFn: vi.fn(() => mockResponse({ audios: [] })) });
      await new Promise(r => setTimeout(r, 30));
      const cards = p.element.querySelectorAll('.audio-ctx-card');
      expect(cards.length).toBe(4);
      const ctxKeys = Array.from(cards).map(c => c.getAttribute('data-ctx'));
      expect(ctxKeys).toContain('lead_cuestiona_ia');
      expect(ctxKeys).toContain('saludo_inicial_calido');
      expect(ctxKeys).toContain('compra_confirmada');
      expect(ctxKeys).toContain('despedida_calida');
    });

    test('con audio existente -> muestra audio player + botones reemplazar/eliminar', async () => {
      const fetchFn = vi.fn(() => mockResponse({
        audios: [{ context: 'compra_confirmada', fileUrl: 'https://s/c.mp3', durationSec: 10 }],
      }));
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      expect(p.element.querySelector('.btn-replace[data-ctx="compra_confirmada"]')).toBeTruthy();
      expect(p.element.querySelector('.btn-delete[data-ctx="compra_confirmada"]')).toBeTruthy();
    });

    test('sin audio -> muestra boton subir + script sugerido', async () => {
      const p = createPanel({ uid: 'u1', fetchFn: vi.fn(() => mockResponse({ audios: [] })) });
      await new Promise(r => setTimeout(r, 30));
      const labels = p.element.querySelectorAll('.btn-upload');
      expect(labels.length).toBe(4);
      const details = p.element.querySelectorAll('details');
      expect(details.length).toBe(4);
    });

    test('audio sin durationSec -> muestra "?"', async () => {
      const fetchFn = vi.fn(() => mockResponse({
        audios: [{ context: 'lead_cuestiona_ia', fileUrl: 'https://s/a.mp3' }],
      }));
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      expect(p.element.textContent).toContain('?');
    });

    test('escapeHtml previene XSS en audio fileUrl', async () => {
      const fetchFn = vi.fn(() => mockResponse({
        audios: [{ context: 'lead_cuestiona_ia', fileUrl: '<script>alert(1)</script>', durationSec: 5 }],
      }));
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      // No script tag insertado
      const scripts = p.element.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });
  });

  describe('handleUpload', () => {
    test('sin uploadFn -> alert + return', async () => {
      const alertCalls = [];
      global.alert = (msg) => alertCalls.push(msg);
      const fetchFn = vi.fn(() => mockResponse({ audios: [] }));
      const p = createPanel({ uid: 'u1', fetchFn, uploadFn: null });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="lead_cuestiona_ia"]');
      const file = new File(['data'], 'audio.mp3', { type: 'audio/mp3' });
      Object.defineProperty(input, 'files', { value: [file], writable: false });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 30));
      expect(alertCalls.some(m => m.includes('Upload no configurado'))).toBe(true);
      delete global.alert;
    });

    test('upload exitoso -> POST + refresh', async () => {
      const callLog = [];
      const fetchFn = vi.fn((url, init) => {
        callLog.push({ url, method: init && init.method });
        return mockResponse({ audios: [] });
      });
      const uploadFn = vi.fn().mockResolvedValue('https://storage/u/audio.mp3');
      const p = createPanel({
        uid: 'u1',
        fetchFn,
        uploadFn,
        getToken: async () => 'tok',
        measureDurationFn: async () => 12,
      });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="lead_cuestiona_ia"]');
      const file = new File(['data'], 'voz.mp3', { type: 'audio/mp3' });
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 50));
      expect(uploadFn).toHaveBeenCalled();
      const postCall = callLog.find(c => c.method === 'POST');
      expect(postCall).toBeTruthy();
      expect(postCall.url).toContain('/api/owner-voice');
    });

    test('upload backend fail -> state.error', async () => {
      let postFailed = false;
      const fetchFn = vi.fn((url, init) => {
        if (init && init.method === 'POST') {
          postFailed = true;
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'storage_fail' }) });
        }
        return mockResponse({ audios: [] });
      });
      const uploadFn = vi.fn().mockResolvedValue('https://storage/a.mp3');
      const p = createPanel({ uid: 'u1', fetchFn, uploadFn, measureDurationFn: async () => 10 });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="saludo_inicial_calido"]');
      Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.mp3')] });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 50));
      expect(postFailed).toBe(true);
      expect(p._getState().error).toBe('storage_fail');
    });

    test('upload backend fail con json parse fail -> error="unknown"', async () => {
      const fetchFn = vi.fn((url, init) => {
        if (init && init.method === 'POST') {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('parse')) });
        }
        return mockResponse({ audios: [] });
      });
      const uploadFn = vi.fn().mockResolvedValue('https://storage/x.mp3');
      const p = createPanel({ uid: 'u1', fetchFn, uploadFn, measureDurationFn: async () => 10 });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="despedida_calida"]');
      Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.mp3')] });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 50));
      // Fallback chain: err = { error: 'unknown' } -> throw new Error('unknown')
      expect(p._getState().error).toBe('unknown');
    });

    test('upload backend fail con json error vacio -> default upload_failed', async () => {
      const fetchFn = vi.fn((url, init) => {
        if (init && init.method === 'POST') {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
        }
        return mockResponse({ audios: [] });
      });
      const uploadFn = vi.fn().mockResolvedValue('https://storage/y.mp3');
      const p = createPanel({ uid: 'u1', fetchFn, uploadFn, measureDurationFn: async () => 10 });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="compra_confirmada"]');
      Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.mp3')] });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 50));
      expect(p._getState().error).toBe('upload_failed');
    });

    test('upload sin getToken -> sin Authorization header', async () => {
      const callLog = [];
      const fetchFn = vi.fn((url, init) => {
        callLog.push({ url, method: init && init.method, headers: init && init.headers });
        return mockResponse({ audios: [] });
      });
      const uploadFn = vi.fn().mockResolvedValue('https://storage/a.mp3');
      const p = createPanel({ uid: 'u1', fetchFn, uploadFn, measureDurationFn: async () => 10, getToken: async () => null });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="lead_cuestiona_ia"]');
      Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.mp3')] });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 50));
      const postCall = callLog.find(c => c.method === 'POST');
      expect(postCall).toBeTruthy();
      expect(postCall.headers.Authorization).toBeUndefined();
    });

    test('input change sin file -> no-op', async () => {
      const uploadFn = vi.fn();
      const p = createPanel({ uid: 'u1', fetchFn: vi.fn(() => mockResponse({ audios: [] })), uploadFn });
      await new Promise(r => setTimeout(r, 30));
      const input = p.element.querySelector('input[type="file"][data-ctx="lead_cuestiona_ia"]');
      Object.defineProperty(input, 'files', { value: [] });
      input.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 30));
      expect(uploadFn).not.toHaveBeenCalled();
    });
  });

  describe('handleDelete', () => {
    test('delete exitoso -> refresh', async () => {
      const callLog = [];
      const fetchFn = vi.fn((url, init) => {
        callLog.push({ url, method: init && init.method });
        if (init && init.method === 'DELETE') return mockResponse({ ok: true });
        return mockResponse({ audios: [{ context: 'lead_cuestiona_ia', fileUrl: 'a.mp3', durationSec: 5 }] });
      });
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      const delBtn = p.element.querySelector('.btn-delete[data-ctx="lead_cuestiona_ia"]');
      delBtn.click();
      await new Promise(r => setTimeout(r, 50));
      const delCall = callLog.find(c => c.method === 'DELETE');
      expect(delCall).toBeTruthy();
      expect(delCall.url).toContain('/api/owner-voice/lead_cuestiona_ia');
    });

    test('delete !ok -> state.error', async () => {
      const fetchFn = vi.fn((url, init) => {
        if (init && init.method === 'DELETE') return mockResponse({}, false, 500);
        return mockResponse({ audios: [{ context: 'compra_confirmada', fileUrl: 'a.mp3', durationSec: 5 }] });
      });
      const p = createPanel({ uid: 'u1', fetchFn });
      await new Promise(r => setTimeout(r, 30));
      const delBtn = p.element.querySelector('.btn-delete[data-ctx="compra_confirmada"]');
      delBtn.click();
      await new Promise(r => setTimeout(r, 30));
      expect(p._getState().error).toBe('delete_failed_500');
    });

    test('delete sin uid -> no-op', async () => {
      const fetchFn = vi.fn(() => mockResponse({ audios: [] }));
      const p = createPanel({ uid: null, fetchFn });
      await new Promise(r => setTimeout(r, 30));
      // No delete buttons render
      expect(p.element.querySelectorAll('.btn-delete').length).toBe(0);
    });
  });

  describe('btn-replace -> sintetic file input', () => {
    test('click triggers file input creation', async () => {
      const fetchFn = vi.fn(() => mockResponse({
        audios: [{ context: 'saludo_inicial_calido', fileUrl: 'a.mp3', durationSec: 5 }],
      }));
      const p = createPanel({ uid: 'u1', fetchFn, uploadFn: vi.fn() });
      await new Promise(r => setTimeout(r, 30));
      const replaceBtn = p.element.querySelector('.btn-replace[data-ctx="saludo_inicial_calido"]');
      // Mock createElement to capture
      const realCreate = document.createElement.bind(document);
      const created = [];
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = realCreate(tag);
        if (tag === 'input') { created.push(el); }
        return el;
      });
      replaceBtn.click();
      expect(created.length).toBeGreaterThan(0);
      expect(created[0].type).toBe('file');
      document.createElement.mockRestore();
    });
  });
});
