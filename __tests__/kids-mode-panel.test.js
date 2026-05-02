import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createKidsModePanel = require('../assets/ludomiia-panels/kids-mode-panel.js');

const SESSION_ACTIVE = {
  status: 'active',
  stepNumber: 1,
  totalSteps: 5,
  currentStep: {
    prompt: '¿Cuantos pasos mueves?',
    choices: [
      { id: 'uno', label: 'Uno' },
      { id: 'dos', label: 'Dos' },
      { id: 'tres', label: 'Tres' },
    ],
  },
};

const SESSION_ENDED = {
  status: 'ended',
  result: { message: '¡Ganaste!', score: 10 },
};

describe('kids-mode-panel.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('crea element HTMLElement', () => {
    const p = createKidsModePanel({ getToken: async () => 't' });
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('loading muestra spinner', () => {
    const p = createKidsModePanel({ getToken: async () => 't' });
    expect(p.element.textContent).toContain('⏳');
  });

  test('loading deshabilita endBtn', () => {
    const p = createKidsModePanel({ getToken: async () => 't' });
    expect(p.element.querySelector('button').hasAttribute('disabled')).toBe(true);
  });

  test('refresh muestra paso activo', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('¿Cuantos pasos mueves?');
  });

  test('badge muestra paso N / total', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, getToken: async () => 't' });
    await p.refresh();
    const badge = p.element.querySelector('span');
    expect(badge.textContent).toContain('Paso 1 / 5');
  });

  test('badge sin totalSteps muestra Jugando', async () => {
    const p = createKidsModePanel({
      fetchSession: async () => ({ ...SESSION_ACTIVE, totalSteps: 0 }),
      getToken: async () => 't',
    });
    await p.refresh();
    const badge = p.element.querySelector('span');
    expect(badge.textContent).toBe('Jugando');
  });

  test('tres opciones renderizan buttons .kids-choice', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.kids-choice').length).toBe(3);
  });

  test('status ended muestra pantalla completa con mensaje', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ENDED, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('¡Ganaste!');
    expect(p.element.textContent).toContain('🌟');
  });

  test('status ended muestra score', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ENDED, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('10 puntos');
  });

  test('status ended badge dice Terminado', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ENDED, getToken: async () => 't' });
    await p.refresh();
    const badge = p.element.querySelector('span');
    expect(badge.textContent).toBe('Terminado');
  });

  test('status ended deshabilita endBtn', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ENDED, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelector('.btn-ghost.btn-sm').hasAttribute('disabled')).toBe(true);
  });

  test('refresh error muestra mensaje error', async () => {
    const p = createKidsModePanel({
      fetchSession: async () => { throw new Error('NET_ERR'); },
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p._state.error).toBe('NET_ERR');
  });

  test('error state muestra texto y deshabilita btn', async () => {
    const p = createKidsModePanel({ getToken: async () => 't' });
    p._setState({ loading: false, error: 'Fallo carga' });
    expect(p.element.textContent).toContain('Fallo carga');
    expect(p.element.querySelector('button').hasAttribute('disabled')).toBe(true);
  });

  test('handleChoose llama sendChoiceFn', async () => {
    const sendChoice = vi.fn(async () => SESSION_ACTIVE);
    const p = createKidsModePanel({ sessionId: 's1', fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 'tok' });
    await p.refresh();
    const choice = SESSION_ACTIVE.currentStep.choices[0];
    await p._handleChoose(choice);
    expect(sendChoice).toHaveBeenCalledWith('s1', choice, 'tok');
  });

  test('handleChoose actualiza session', async () => {
    const next = { ...SESSION_ACTIVE, stepNumber: 2 };
    const sendChoice = vi.fn(async () => next);
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 't' });
    await p.refresh();
    await p._handleChoose({ id: 'uno' });
    expect(p._state.session.stepNumber).toBe(2);
  });

  test('handleChoose con respuesta null no rompe', async () => {
    const sendChoice = vi.fn(async () => null);
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 't' });
    await p.refresh();
    await p._handleChoose({ id: 'uno' });
    expect(p._state.error).toBeNull();
  });

  test('handleChoose re-entering (choosing=true) no llama fn', async () => {
    const sendChoice = vi.fn();
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 't' });
    await p.refresh();
    p._setState({ choosing: true });
    await p._handleChoose({ id: 'uno' });
    expect(sendChoice).not.toHaveBeenCalled();
  });

  test('handleChoose re-entering (ending=true) no llama fn', async () => {
    const sendChoice = vi.fn();
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 't' });
    await p.refresh();
    p._setState({ ending: true });
    await p._handleChoose({ id: 'uno' });
    expect(sendChoice).not.toHaveBeenCalled();
  });

  test('handleChoose error establece state.error', async () => {
    const sendChoice = vi.fn(async () => { throw new Error('CHOICE_ERR'); });
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 't' });
    await p.refresh();
    await p._handleChoose({ id: 'uno' });
    expect(p._state.error).toBe('CHOICE_ERR');
    expect(p._state.choosing).toBe(false);
  });

  test('click boton kids-choice dispara handleChoose', async () => {
    const sendChoice = vi.fn(async () => SESSION_ACTIVE);
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, sendChoice, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.kids-choice').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(sendChoice).toHaveBeenCalled();
  });

  test('handleEnd llama endGameFn y llama onEnd', async () => {
    const endGame = vi.fn(async () => ({ ok: true }));
    const onEnd = vi.fn();
    const p = createKidsModePanel({ sessionId: 's1', fetchSession: async () => SESSION_ACTIVE, endGame, onEnd, getToken: async () => 'tok' });
    await p.refresh();
    await p._handleEnd();
    expect(endGame).toHaveBeenCalledWith('s1', 'tok');
    expect(onEnd).toHaveBeenCalled();
  });

  test('handleEnd marca session.status ended', async () => {
    const endGame = vi.fn(async () => null);
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, endGame, getToken: async () => 't' });
    await p.refresh();
    await p._handleEnd();
    expect(p._state.session.status).toBe('ended');
  });

  test('handleEnd re-entering (ending=true) no llama fn', async () => {
    const endGame = vi.fn();
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, endGame, getToken: async () => 't' });
    await p.refresh();
    p._setState({ ending: true });
    await p._handleEnd();
    expect(endGame).not.toHaveBeenCalled();
  });

  test('handleEnd re-entering (choosing=true) no llama fn', async () => {
    const endGame = vi.fn();
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, endGame, getToken: async () => 't' });
    await p.refresh();
    p._setState({ choosing: true });
    await p._handleEnd();
    expect(endGame).not.toHaveBeenCalled();
  });

  test('handleEnd error establece state.error', async () => {
    const endGame = vi.fn(async () => { throw new Error('END_ERR'); });
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, endGame, getToken: async () => 't' });
    await p.refresh();
    await p._handleEnd();
    expect(p._state.error).toBe('END_ERR');
    expect(p._state.ending).toBe(false);
  });

  test('click boton Salir dispara handleEnd', async () => {
    const endGame = vi.fn(async () => null);
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, endGame, getToken: async () => 't' });
    await p.refresh();
    p.element.querySelector('.btn-ghost.btn-sm').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(endGame).toHaveBeenCalled();
  });

  test('default callbacks sin opts no rompen', async () => {
    const p = createKidsModePanel(undefined);
    await p.refresh();
    expect(p.element).toBeInstanceOf(HTMLElement);
  });

  test('_setState loading:true vuelve a spinner', async () => {
    const p = createKidsModePanel({ fetchSession: async () => SESSION_ACTIVE, getToken: async () => 't' });
    await p.refresh();
    p._setState({ loading: true });
    expect(p.element.textContent).toContain('⏳');
  });

  test('step sin prompt muestra fallback', async () => {
    const s = { ...SESSION_ACTIVE, currentStep: { choices: [] } };
    const p = createKidsModePanel({ fetchSession: async () => s, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('¿Que hacemos ahora?');
  });

  test('result null muestra mensaje default en renderComplete', async () => {
    const p = createKidsModePanel({
      fetchSession: async () => ({ status: 'ended', result: null }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.textContent).toContain('Terminaste la partida');
  });

  test('result sin score no muestra puntos', async () => {
    const p = createKidsModePanel({
      fetchSession: async () => ({ status: 'ended', result: { message: 'Bien', score: null } }),
      getToken: async () => 't',
    });
    await p.refresh();
    expect(p.element.textContent).not.toContain('puntos');
  });

  test('choice sin label usa id', async () => {
    const s = { ...SESSION_ACTIVE, currentStep: { choices: [{ id: 'cuatro' }] } };
    const p = createKidsModePanel({ fetchSession: async () => s, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('cuatro');
  });

  test('choice sin label ni id usa numero', async () => {
    const s = { ...SESSION_ACTIVE, currentStep: { choices: [{}] } };
    const p = createKidsModePanel({ fetchSession: async () => s, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.querySelectorAll('.kids-choice').length).toBe(1);
  });

  test('session null — sin crash', async () => {
    const p = createKidsModePanel({ fetchSession: async () => null, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('Jugando');
  });

  test('currentStep null — sin crash', async () => {
    const s = { ...SESSION_ACTIVE, currentStep: null };
    const p = createKidsModePanel({ fetchSession: async () => s, getToken: async () => 't' });
    await p.refresh();
    expect(p.element.textContent).toContain('¿Que hacemos ahora?');
  });

  test('click kids-choice mientras canChoose=false no llama fn', async () => {
    const sendChoice = vi.fn();
    const p = createKidsModePanel({ fetchSession: async () => ({ ...SESSION_ACTIVE }), sendChoice, getToken: async () => 't' });
    await p.refresh();
    p._setState({ choosing: true });
    p.element.querySelector('.kids-choice').click();
    await new Promise((r) => setTimeout(r, 20));
    expect(sendChoice).not.toHaveBeenCalled();
  });

  test('handleEnd sin session null no lanza error', async () => {
    const endGame = vi.fn(async () => null);
    const p = createKidsModePanel({ endGame, getToken: async () => 't' });
    await p._handleEnd();
    expect(endGame).toHaveBeenCalled();
    expect(p._state.session).toBeNull();
  });
});
