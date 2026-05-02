import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createAiCoachPanel = require('../assets/ludomiia-panels/ai-coach-panel.js');

const ANALYSIS = {
  score: 42,
  position: 2,
  currentTurn: 'Jugador1',
  tips: [
    { text: 'Construye asentamientos cerca del desierto.', priority: 'high' },
    { text: 'Prioriza los puertos.', priority: 'normal' },
  ],
};

describe('ai-coach-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createAiCoachPanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading state muestra skeleton', () => {
    const p = createAiCoachPanel({ getToken: async () => 't' });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(1);
  });

  test('loading deshabilita input + btn', () => {
    const p = createAiCoachPanel({ getToken: async () => 't' });
    expect(p.element.querySelector('input').hasAttribute('disabled')).toBe(true);
    expect(p.element.querySelector('.btn-primary.btn-sm').hasAttribute('disabled')).toBe(true);
  });

  test('refresh muestra score y position', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('42');
    expect(p.element.textContent).toContain('#2');
  });

  test('refresh muestra currentTurn', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Jugador1');
  });

  test('tips se renderizan', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.coach-tip').length).toBe(2);
  });

  test('tip priority:high tiene estilo diferente', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, getToken: async () => 't' });
    await p.refresh();
    const tips = p.element.querySelectorAll('.coach-tip');
    expect(tips[0].style.borderLeftColor).toBeTruthy();
  });

  test('sin tips muestra empty state', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ({ ...ANALYSIS, tips: [] }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('No hay tips disponibles');
  });

  test('error fetch muestra estado error', async () => {
    const p = createAiCoachPanel({
      fetchAnalysis: async () => { throw new Error('FETCH_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('FETCH_ERR');
  });

  test('analysis null — score fallback "-"', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('-');
  });

  test('analysis con score 0 muestra "0" no "-"', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ({ ...ANALYSIS, score: 0 }), getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('0');
  });

  test('handleRequestTip vacio no envia', async () => {
    const requestTip = vi.fn();
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = '';
    await p._handleRequestTip();
    expect(requestTip).not.toHaveBeenCalled();
  });

  test('handleRequestTip con context llama requestTip', async () => {
    const requestTip = vi.fn(async () => ({ tips: [{ text: 'nuevo tip' }] }));
    const p = createAiCoachPanel({ sessionId: 's1', fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 'tok' });
    await p.refresh();
    p.element.querySelector('input').value = 'mi contexto';
    await p._handleRequestTip();
    expect(requestTip).toHaveBeenCalledWith('s1', 'mi contexto', 'tok');
  });

  test('requestTip actualiza tips en analysis', async () => {
    const requestTip = vi.fn(async () => ({ tips: [{ text: 'Tip nuevo', priority: 'normal' }] }));
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'contexto';
    await p._handleRequestTip();
    expect(p.element.querySelectorAll('.coach-tip').length).toBe(1);
  });

  test('requestTip response sin tips array no rompe', async () => {
    const requestTip = vi.fn(async () => ({ message: 'ok' }));
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'x';
    await p._handleRequestTip();
    expect(p._state.requestError).toBeNull();
  });

  test('requestTip con analysis null y response con tips crea analysis obj', async () => {
    const requestTip = vi.fn(async () => ({ tips: [{ text: 'T1' }] }));
    const p = createAiCoachPanel({ fetchAnalysis: async () => null, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'ctx';
    await p._handleRequestTip();
    expect(p._state.analysis.tips.length).toBe(1);
  });

  test('handleRequestTip guardado re-entering (requesting=true)', async () => {
    const requestTip = vi.fn();
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p._setState({ requesting: true });
    p.element.querySelector('input').value = 'x';
    await p._handleRequestTip();
    expect(requestTip).not.toHaveBeenCalled();
  });

  test('click btn Pedir tip dispara handleRequestTip', async () => {
    const requestTip = vi.fn(async () => null);
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'test';
    p.element.querySelector('.btn-primary.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(requestTip).toHaveBeenCalled();
  });

  test('requestError se muestra y limpia', async () => {
    const requestTip = vi.fn(async () => { throw new Error('TIP_ERR'); });
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'x';
    await p._handleRequestTip();
    expect(p._state.requestError).toBe('TIP_ERR');
    p._setState({ requestError: null });
    expect(p.element.querySelector('p[style*="display"]').style.display).toBe('none');
  });

  test('onClose llama callback', () => {
    const onClose = vi.fn();
    const p = createAiCoachPanel({ getToken: async () => 't', onClose });
    p.element.querySelector('button[title="Cerrar"]').click();
    expect(onClose).toHaveBeenCalled();
  });

  test('default onClose no-op no rompe', () => {
    const p = createAiCoachPanel({ getToken: async () => 't' });
    expect(() => p.element.querySelector('button[title="Cerrar"]').click()).not.toThrow();
  });

  test('callbacks default sin opts no rompen', async () => {
    const p = createAiCoachPanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true re-muestra skeleton', async () => {
    const p = createAiCoachPanel({ fetchAnalysis: async () => ANALYSIS, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    const skels = p.element.querySelectorAll('div[style*="bg-elevated"]');
    expect(skels.length).toBeGreaterThanOrEqual(1);
  });

  test('tip priority:normal no tiene fondo degradado', async () => {
    const p = createAiCoachPanel({
      fetchAnalysis: async () => ({ ...ANALYSIS, tips: [{ text: 'Tip', priority: 'normal' }] }),
      getToken: async () => 't',
    });
    await p.refresh();
    const tip = p.element.querySelector('.coach-tip');
    expect(tip.style.background).not.toContain('gradient');
  });

  test('handleRequestTip con sessionId especifico', async () => {
    const requestTip = vi.fn(async () => null);
    const p = createAiCoachPanel({ sessionId: 'myS', fetchAnalysis: async () => ANALYSIS, requestTip, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('input').value = 'ctx';
    await p._handleRequestTip();
    expect(requestTip).toHaveBeenCalledWith('myS', 'ctx', 't');
  });
});
